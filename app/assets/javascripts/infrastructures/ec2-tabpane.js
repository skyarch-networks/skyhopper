const queryString = require('query-string').parse(window.location.search);
const ansiUp = require('ansi_up');

const modal = require('../modal');
const commonMethods = require('../infrastructures/common-methods');
const helpers = require('../infrastructures/helper.js');
const showInfra = require('../infrastructures/show_infra');

const { toLocaleString } = helpers;
const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;
const alertAndShowInfra = helpers.alert_and_show_infra;

const hasSelected = commonMethods.has_selected;
const checkTag = commonMethods.check_tag;

const Snapshot = require('../models/snapshot').default;
const EC2Instance = require('../models/ec2_instance').default;
const Dish = require('../models/dish').default;
const Infrastructure = require('../models/infrastructure').default;

module.exports = Vue.extend({
  template: '#ec2-tabpane-template',

  props: {
    physical_id: {
      type: String,
      required: true,
    },
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      loading: false,
      loading_s: false,
      loading_snapshots: false,
      loading_groups: false,
      inprogress: false, // for cook
      ec2_status_changing: false,
      chef_console_text: '',
      selected_dish: null,
      ec2: { availability_zones: {}, snapshots: [] },
      volume_selected: '',
      sort_key: '',
      sort_asc: false,
      schedule_type: '',
      schedule: {},
      loading_volumes: false,
      attachable_volumes: [],
      max_sec_group: null,
      rules_summary: null,
      x_chef: null,
      x_zabbix: null,
      editing_policy: {},
      volume_options: {},
      page: 0,
      dispItemSize: 10,
      filteredLength: null,
      filterKey: '',
      placement: 'left',
      lang: queryString.lang,
      sec_group: t('ec2_instances.msg.security_groups'),
      change_status: t('ec2_instances.change_status'),
      attach_vol: t('ec2_instances.attach'),
      changing_status: t('ec2_instances.changing_status'),
      is_yum_update: false,
      change_scale_type_to: '',
      cook_status: '',
    };
  },

  methods: {
    start_ec2() {
      if (this.running) { return; }
      if (this.ec2_status_changing) { return; }
      this.ec2_status_changing = true;

      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      ec2.start_ec2()
        .done(alertSuccess(this._show_ec2))
        .fail(alertDanger(this._show_ec2));
    },

    stop_ec2() {
      if (this.stopped) { return; }
      if (this.ec2_status_changing) { return; }
      this.ec2_status_changing = true;

      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      ec2.stop_ec2()
        .done(alertSuccess(this._show_ec2))
        .fail(alertDanger(this._show_ec2));
    },

    reboot_ec2() {
      if (this.stopped) { return; }
      if (this.ec2_status_changing) { return; }
      this.ec2_status_changing = true;

      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      ec2.reboot_ec2()
        .fail(alertDanger(this._show_ec2));
    },

    detach_ec2() {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.detach'), 'danger').done(() => {
        ec2.detach_ec2(self.x_zabbix, self.x_chef)
          .done(alertSuccess(() => {
            showInfra(infra.id);
          }))
          .fail(alertDanger(this._show_ec2));
      });
    },

    terminate_ec2() {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.terminate'), 'danger').done(() => {
        ec2.terminate_ec2()
          .done(alertSuccess(() => {
            showInfra(infra.id);
          }))
          .fail(alertDanger(this._show_ec2));
      });
    },

    _cook(methodName, params) {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);

      const dfd = ec2[methodName](params);
      dfd.fail(
        // cook start fail
        alertDanger(this._show_ec2),
      ).progress((state, msg) => {
        // cook start success
        if (state !== 'start') { return; }

        alertSuccess(() => {
          self.inprogress = true;
          Vue.nextTick(() => {
            self.watch_cook(dfd);
          });
        })(msg);
      });
    },

    watch_cook(dfd) {
      const self = this;
      const el = document.getElementById('cook-status');

      // 更新されるたびにスクロールすると、scrollHeight 等が重い処理なのでブラウザが固まってしまう。
      // そのため、100msに1回スクロールするようにしている。
      {
        const scroll = () => {
          Vue.nextTick(() => {
            el.scrollTop = el.scrollHeight;
            if (self.inprogress) { setTimeout(scroll, 100); }
          });
        };
        scroll();
      }

      dfd.done(() => {
        // cook end
        self.chef_console_text = '';
        self.inprogress = false;
        if (self.is_yum_update) {
          this._prompt_yum_log();
        } else {
          this._show_ec2();
        }
      }).progress((state, msg) => {
        if (state !== 'update') { return; }

        self.chef_console_text += msg;
      });
    },

    apply_dish() {
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, this.physical_id);
      ec2.apply_dish(this.selected_dish)
        .done(alertSuccess(this._show_ec2))
        .fail(alertDanger(this._show_ec2));
    },

    run_ansible_playbook() {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);

      const dfd = ec2.run_ansible_playbook();
      dfd.fail(
        // run_ansible start fail
        alertDanger(this._show_ec2),
      ).progress((state, msg) => {
        // run_ansible start success
        if (state !== 'start') { return; }

        alertSuccess(() => {
          self.inprogress = true;
          Vue.nextTick(() => {
            self.watch_cook(dfd);
          });
        })(msg);
      });
    },

    yum_update(security, exec) {
      const self = this;
      self.is_yum_update = true;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);

      const securityBool = (security === 'security');
      const execBool = (exec === 'exec');

      modal.Confirm(t('infrastructures.infrastructure'), t('nodes.msg.yum_update_confirm'), 'danger').done(() => {
        const dfd = ec2.yum_update(securityBool, execBool).fail(
          // cook start fail
          alertDanger(this._show_ec2),
        ).progress((state) => {
          // cook start success
          if (state !== 'start') { return; }
          self.inprogress = true;
          Vue.nextTick(() => {
            self.watch_cook(dfd);
          });
        });
      });
    },

    _prompt_yum_log() {
      const self = this;
      self.is_yum_update = false;

      modal.ConfirmHTML(t('infrastructures.infrastructure'), t('nodes.msg.yum_update_success', { physical_id: self.physical_id }), 'success').done(() => {
        self.$parent.tabpaneID = 'infra_logs';
        this._loading();
      }).fail(() => {
        this._show_ec2();
      });
    },

    edit_ansible_playbook() {
      this.$parent.tabpaneID = 'edit_ansible_playbook';
      this._loading();
    },
    select_servertest() {
      this.$parent.tabpaneID = 'serverspec';
      this._loading();
    },
    serverspec_results() {
      this.$parent.tabpaneID = 'serverspec_results';
      this._loading();
    },
    view_rules() {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.ec2.security_groups;
      this._loading();
      this.$parent.instance_type = 'ec2';
    },

    _show_ec2() { this.$parent.show_ec2(this.physical_id); },

    _label_class(status) {
      if (status === 'Success') {
        return 'label-success';
      } if (status === 'Failed') {
        return 'label-danger';
      } if (status === 'UnExecuted') {
        return 'label-warning';
      } // InProgress, Pending and others.
      return 'label-default';
    },

    is_role(run) { return run.indexOf('role') !== -1; },
    is_first(idx) { return (idx === 0); },
    runlist_type(run) { return run.replace(/\[.+\]$/, ''); },
    runlist_name(run) { return run.replace(/^.+\[(.+)\]$/, '$1'); },
    ansi_up(log) { return ansiUp.ansi_to_html(log); },

    _loading() { this.$parent.loading = true; },

    change_scale() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      ec2.change_scale(self.change_scale_type_to).done((msg) => {
        alertSuccess(this._show_ec2)(msg);
        $('#change-scale-modal').modal('hide');
      }).fail((msg) => {
        alertDanger(this._show_ec2)(msg);
        $('#change-scale-modal').modal('hide');
      });
    },

    change_schedule() {
      switch (this.schedule_type) {
        case 'yum':
          this.change_yum_schedule();
          break;
        case 'snapshot':
          this.change_snapshot_schedule();
          break;

        // no default
      }
    },

    change_yum_schedule() {
      const self = this;
      self.loading_s = true;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      ec2.schedule_yum(self.schedule).done((msg) => {
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alertSuccess()(msg);
      }).fail((msg) => {
        self.loading_s = false;
        alertDanger()(msg);
      });
    },

    change_snapshot_schedule() {
      const self = this;
      self.loading_s = true;
      const s = new Snapshot(this.infra_id);
      s.schedule(self.volume_selected, self.physical_id, self.schedule).done((msg) => {
        self.ec2.snapshot_schedules[self.volume_selected] = self.schedule;
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alertSuccess()(msg);
      }).fail((msg) => {
        self.loading_s = false;
        alertDanger()(msg);
      });
    },

    is_root_device(deviceName) {
      return this.ec2.root_device_name === deviceName;
    },

    create_snapshot(volumeId) {
      const self = this;
      modal.Confirm(t('snapshots.create_snapshot'), t('snapshots.msg.create_snapshot', {
        volume_id: volumeId,
      })).done(() => {
        const snapshot = new Snapshot(self.infra_id);

        snapshot.create(volumeId, self.physical_id).progress(() => {
          modal.Alert(t('snapshots.snapshots'), t('snapshots.msg.creation_started'));
        }).done(self.load_snapshots)
          .fail(alertDanger());

        self.load_snapshots();
      });
    },

    open_schedule_modal() { $('#change-schedule-modal').modal('show'); },

    open_yum_schedule_modal() {
      this.schedule_type = 'yum';
      this.schedule = this.ec2.yum_schedule;
      this.open_schedule_modal();
    },
    open_snapshot_schedule_modal(volumeId) {
      this.schedule_type = 'snapshot';
      this.schedule = Object.assign({}, this.ec2.snapshot_schedules[volumeId]);
      this.open_schedule_modal();
    },

    load_snapshots() {
      const self = this;
      const snapshot = new Snapshot(this.infra_id);
      this.loading_snapshots = true;
      snapshot.index(null).done((data) => {
        self.ec2.snapshots = data.snapshots.map((s) => {
          s.selected = false;
          return s;
        });
        self.sort_key = '';
        self.sort_by('start_time');
        self.loading_snapshots = false;
      }).fail(alertDanger());
    },

    delete_selected_snapshots() {
      const self = this;
      const snapshots = this.ec2.snapshots.filter(snapshot => snapshot.selected === true);
      const snapshotIds = snapshots.map(snapshot => snapshot.snapshot_id);
      let confirmBody = t('snapshots.msg.delete_snapshot');
      confirmBody += `<ul><li>${snapshotIds.join('</li><li>')}</li></ul>`;
      modal.ConfirmHTML(t('snapshots.delete_snapshot'), confirmBody, 'danger').done(() => {
        const s = new Snapshot(self.infra_id);

        snapshots.forEach((snapshot) => {
          s.destroy(snapshot.snapshot_id)
            .done(() => {
              const index = self.ec2.snapshots.indexOf(snapshot);
              self.ec2.snapshots.splice(index, 1);
            })
            .fail(alertDanger());
        });
      });
    },

    snapshot_status(snapshot) {
      if (snapshot.state === 'pending') {
        return `${snapshot.state}(${snapshot.progress})`;
      }
      return snapshot.state;
    },

    sort_by(key) {
      if (this.sort_key === key) {
        this.sort_asc = !this.sort_asc;
      } else {
        this.sort_asc = false;
        this.sort_key = key;
      }
      if (!this.sort_key) {
        return;
      }
      this.ec2.snapshots = this.ec2.snapshots.sort((a, b) => {
        if (a[key] < b[key]) {
          if (this.sort_asc) {
            return -1;
          }
          return 1;
        }
        if (a[key] > b[key]) {
          if (this.sort_asc) {
            return 1;
          }
          return -1;
        }
        return 0;
      });
    },

    sorting_by(key) {
      return this.sort_key === key;
    },

    load_volumes() {
      if ($('#attachButton.dropdown.open').length) { return; }
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      this.loading_volumes = true;
      ec2.attachable_volumes(this.ec2.availability_zone).done((data) => {
        self.attachable_volumes = data.attachable_volumes;
        self.loading_volumes = false;
      });
    },

    attach_volume(volumeId) {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, self.physical_id);
      modal.Prompt(t('ec2_instances.set_device_name'), t('ec2_instances.device_name')).done((deviceName) => {
        ec2.attach_volume(volumeId, deviceName).done((data) => {
          modal.Alert(t('infrastructures.infrastructure'), t('ec2_instances.msg.volume_attached', data)).done(this._show_ec2);
        }).fail(alertDanger());
      });
      $('[id^=bootstrap_prompt_]').val(this.suggest_device_name);
    },

    detach_volume() {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, this.physical_id);
      modal.Confirm(
        t('ec2_instances.detach_volume'),
        t('ec2_instances.msg.detach_volume', { volumeId: this.volume_selected, physical_id: this.physical_id }),
        'danger',
      ).done(() => {
        ec2.detach_volume(self.volume_selected).done((data) => {
          modal.Alert(t('ec2_instances.detach_volume'), data).done(this._show_ec2);
        }).fail(alertDanger());
      });
    },

    edit_retention_policy() {
      const self = this;
      if (Object.keys(self.ec2.retention_policies).includes(self.volume_selected)) {
        self.editing_policy = Object.assign({}, self.ec2.retention_policies[self.volume_selected]);
      } else {
        self.editing_policy = {};
      }
    },

    save_retention_policy(volumeId, policy) {
      const self = this;
      const retentionPolicies = self.ec2.retention_policies;
      const infra = new Infrastructure(self.infra_id);
      const snapshot = new Snapshot(infra.id);
      snapshot.save_retention_policy(volumeId, policy.enabled, policy.max_amount)
        .done((msg) => {
          retentionPolicies[volumeId] = policy;

          $('#retention-policy-modal').modal('hide');
          alertSuccess()(msg);
        }).fail(alertDanger());
    },

    on_click_volume(volumeId) {
      const self = this;
      const panelOpened = document.getElementById('ebs_panel').classList.contains('in');
      const same = this.volume_selected === volumeId;
      if (panelOpened && same) {
        $('#ebs_panel').collapse('hide');
        setTimeout(() => {
          self.volume_selected = '';
        }, 300);
      } else {
        this.volume_selected = volumeId;
        this.$nextTick(() => {
          $('#ebs_panel').collapse('show');
        });
      }
    },

    latest_snapshot(volumeId) {
      return this.ec2.snapshots
        .filter(snapshot => (
          snapshot.volume_id === volumeId
          && snapshot.state === 'completed'
        ))
        .sort((a, b) => {
          if (a.start_time < b.start_time) {
            return -1;
          }
          if (a.start_time > b.start_time) {
            return 1;
          }
          return 0;
        })
        .slice(-1)[0];
    },

    latest_snapshot_date(volumeId) {
      const snapshot = this.latest_snapshot(volumeId);
      if (snapshot) {
        const date = new Date(snapshot.start_time);
        return date.toLocaleString();
      }
      return undefined;
    },

    create_volume() {
      const infra = new Infrastructure(this.infra_id);
      const instance = new EC2Instance(infra, this.physical_id);
      const self = this;
      this.loading_s = true;
      instance.create_volume(this.volume_options)
        .done((msg) => {
          self.loading_s = false;
          $('#create_volume_modal').modal('hide');
          alertSuccess()(msg, true);
        })
        .fail((data) => {
          self.loading_s = false;
          alertDanger()(data);
        });
    },

    init_volume_options(snapshot) {
      if (typeof snapshot === 'undefined') {
        this.volume_options = {};
      } else {
        this.volume_options = {
          snapshot_id: snapshot.snapshot_id,
          size: snapshot.volume_size,
          encrypted: snapshot.encrypted,
          availability_zone: this.ec2.availability_zone,
        };
      }
    },

    toLocaleString,

    capitalize(str) {
      // 中身はUpperCamelCaseにする処理
      const capitalizeStr = str.charAt(0).toUpperCase() + str.slice(1);
      return capitalizeStr.replace(/[-_ ]+(.)/g, (match, p1) => p1.toUpperCase());
    },

    get_security_groups() {
      const self = this;
      self.loading_groups = true;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, this.physical_id);
      ec2.get_security_groups().done((data) => {
        self.rules_summary = data.params;
        self.loading_groups = false;
        self.filteredLength = data.params.length;
      });
    },

    check(i) { i.checked = !i.checked; },
    reload() { this.$parent.show_ec2(this.physical_id); },

    submit_groups() {
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, this.physical_id);
      const groupIds = this.rules_summary.filter(t => t.checked).map(t => t.group_id);

      ec2.submit_groups(groupIds)
        .done(alertSuccess(this._show_ec2))
        .fail(alertDanger(this._show_ec2));
    },

    showPrev() {
      if (this.isStartPage) return;
      this.page -= 1;
    },
    showNext() {
      if (this.isEndPage) return;
      this.page += 1;
    },
    check_tgg(r) {
      return checkTag(r);
    },
    roundup(val) { return (Math.ceil(val)); },
    suffix_current_az(zoneName) {
      return (this.ec2.availability_zone === zoneName) ? (`${zoneName}(current)`) : zoneName;
    },
  },

  computed: {
    ec2_btn_class() {
      if (this.running) {
        return 'btn-success';
      }
      return 'btn-default';
    },
    has_selected() {
      return hasSelected(this.rules_summary);
    },

    ansible_status_class() { return this._label_class(this.ansible_status); },
    servertest_status_class() { return this._label_class(this.servertest_status); },
    update_status_class() { return this._label_class(this.update_status); },

    ansible_status() { return this.capitalize(this.ec2.info.ansible_status.value); },
    servertest_status() { return this.capitalize(this.ec2.info.servertest_status.value); },
    update_status() { return this.capitalize(this.ec2.info.update_status.value); },

    ansible_time() { return this.ansible_status === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.ansible_status.updated_at); },
    serverspec_time() { return this.servertest_status === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.servertest_status.updated_at); },
    update_time() { return this.update_status === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.update_status.updated_at); },

    runlist_empty() { return !this.ec2.runlist.length; },
    dishes_empty() { return !this.ec2.dishes.length; },

    running() { return this.ec2.status === 'running'; },
    stopped() { return this.ec2.status === 'stopped'; },

    dish_option() {
      return [{ text: 'Select!', value: '0' }].concat(this.ec2.dishes.map(dish => ({ text: dish.name, value: dish.id })));
    },

    next_run() { return (new Date().getHours() + parseInt(this.schedule.time, 10)) % 24; },

    filled_all() {
      if (!this.schedule.enabled) return true;
      switch (this.schedule.frequency) {
        case 'weekly':
          return this.schedule.day_of_week && this.schedule.time;
        case 'daily':
          return this.schedule.time;
        case 'intervals':
          return parseInt(this.schedule.time, 10);
        default:
          return false;
      }
    },

    selected_snapshots() { return this.ec2.snapshots.filter(snapshot => snapshot.selected === true); },

    suggest_device_name() {
      // TODO: iikanji ni sitai
      let suggestedDeviceLetterCode = 102; // same as aws default 'f'
      const deviceLetterCodes = this.ec2.block_devices.chain()
        .pluck('device_name')
        .map((name) => {
          if (/sd([a-z])$/.test(name)) {
            const letter = name.slice(-1);
            if (letter >= 'a' && letter <= 'z') {
              return letter.charCodeAt(0);
            }
            return false;
          }
          return false;
        })
        .filter()
        .sort()
        .value();

      while (deviceLetterCodes.indexOf(suggestedDeviceLetterCode) !== -1) {
        if (suggestedDeviceLetterCode === 122) { // 'z'
          suggestedDeviceLetterCode = 63; // '?'
          break;
        }
        suggestedDeviceLetterCode += 1;
      }

      return `/dev/sd${String.fromCharCode(suggestedDeviceLetterCode)}`;
    },

    is_valid_amount() { return this.editing_policy.max_amount >= 3 && this.editing_policy.max_amount < 1000; },
    is_retention_policy_set() { return this.volume_selected && this.ec2.retention_policies[this.volume_selected].enabled; },
    is_snapshot_schedule_set() { return this.volume_selected && this.ec2.snapshot_schedules[this.volume_selected].enabled; },

    schedule_indicator_message() {
      const schedule = this.ec2.snapshot_schedules[this.volume_selected];
      switch (schedule.frequency) {
        case 'intervals':
          return t('schedules.label.per_n_hours', { n: schedule.time });
        case 'daily':
          return t('schedules.label.daily', { n: schedule.time });
        case 'weekly':
          return t('schedules.label.weekly', { n: schedule.time, w: t(`schedules.day_of_week.${schedule.day_of_week}`) });
        default:
          return undefined;
      }
    },

    dispItems() {
      const startPage = this.page * this.dispItemSize;
      if (this.filterKey === '') {
        return this.rules_summary.slice(startPage, startPage + this.dispItemSize);
      }

      return this.rules_summary;
    },

    filterd_dispitems() {
      const self = this;
      const items = this.dispItems.filter((data) => {
        if (self.filterKey === '') {
          return true;
        }
        return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
      });
      self.filteredLength = items.length;
      return items;
    },

    filterd_snapshot() {
      const self = this;
      const items = this.ec2.snapshots.filter((data) => {
        if (self.volume_selected === '') {
          return true;
        }
        return JSON.stringify(data.volume_id).indexOf(self.volume_selected) !== -1;
      });
      this.filteredLength = items.length;
      return items;
    },

    isStartPage() { return (this.page === 0); },
    isEndPage() { return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length); },

    can_create_volume() {
      return this.volume_options.volume_type
             && this.volume_options.size
             && this.volume_options.availability_zone;
    },
  },

  mounted() {
    this.$nextTick(() => {
      const self = this;

      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, this.physical_id);
      ec2.show().done((data) => {
        self.ec2 = data;
        self.max_sec_group = data.security_groups.length - 1;
        let dishId = '0';
        if (self.ec2.selected_dish) {
          dishId = self.ec2.selected_dish.id;
        }
        self.selected_dish = dishId;

        self.$watch('selected_dish', () => {
          const dish = new Dish();
          dish.runlist(dishId).done((runlist) => {
            self.ec2.runlist = runlist;
          });
        });

        if (self.ec2.info.cook_status === 'InProgress' || self.ec2.info.update_status === 'InProgress') {
          const dfd = $.Deferred();
          ec2.watch_cook(dfd); // watch WebSocket and trigger event.
          self.watch_cook(dfd); // watch dfd event and update DOM.
          self.inprogress = true;
        }
        self.$parent.loading = false;
      }).fail(alertAndShowInfra(infra.id));
    });
  },

  filters: {
    zero_as_null(str) { return (str === 0) ? null : str; },
  },
});
