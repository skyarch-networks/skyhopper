var Infrastructure = require('models/infrastructure').default;
var Dish           = require('models/dish').default;
var EC2Instance    = require('models/ec2_instance').default;
var Snapshot       = require('models/snapshot').default;
var queryString = require('query-string').parse(location.search);

var helpers = require('infrastructures/helper.js');
var toLocaleString       = helpers.toLocaleString;
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var alert_and_show_infra = helpers.alert_and_show_infra;

var common_methods = require('infrastructures/common-methods');
var has_selected         = common_methods.has_selected;
var check_tag            = common_methods.check_tag;

var modal = require('modal');

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

  data: function () {return {
    loading:             false,
    loading_s:           false,
    loading_snapshots:   false,
    loading_groups:      false,
    inprogress:          false, // for cook
    ec2_status_changing: false,
    chef_console_text:   '',
    selected_dish:       null,
    ec2:                 {},
    volume_selected:     null,
    snapshots:           {},
    sort_key:            '',
    sort_asc:            false,
    schedule_type:       '',
    schedule:            {},
    loading_volumes:     false,
    attachable_volumes:  [],
    max_sec_group:       null,
    rules_summary:       null,
    x_chef:              null,
    x_zabbix:            null,
    editing_policy:      {},
    page: 0,
    dispItemSize: 10,
    filteredLength: null,
    filterKey: '',
    placement:          'left',
    lang:               queryString.lang,
    sec_group: t('ec2_instances.msg.security_groups'),
    change_status: t('ec2_instances.change_status'),
    attach_vol: t('ec2_instances.attach'),
    changing_status: t('ec2_instances.changing_status'),
  };},

  methods: {
    bootstrap: function () {
      var self = this;
      self.loading = true;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);

      ec2.bootstrap()
        .done(alert_success(self._show_ec2))
        .fail(alert_danger(self._show_ec2));
    },

    start_ec2: function () {
      if (this.running) {return;}
      if (this.ec2_status_changing) {return;}
      this.ec2_status_changing = true;

      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      ec2.start_ec2()
        .done(alert_success(self._show_ec2))
        .fail(alert_danger(self._show_ec2));
    },

    stop_ec2: function () {
      if (this.stopped) {return;}
      if (this.ec2_status_changing) {return;}
      this.ec2_status_changing = true;

      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      ec2.stop_ec2()
        .done(alert_success(self._show_ec2))
        .fail(alert_danger(self._show_ec2));
    },

    reboot_ec2: function () {
      if (this.stopped) {return;}
      if (this.ec2_status_changing) {return;}
      this.ec2_status_changing = true;

      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      ec2.reboot_ec2()
        .fail(alert_danger(self._show_ec2));
    },

    detach_ec2: function () {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.detach'), 'danger').done(function () {
        ec2.detach_ec2(self.x_zabbix, self.x_chef)
          .done(alert_success(function () {
            require('infrastructures/show_infra.js').show_infra(infra.id);
          }))
          .fail(alert_danger(self._show_ec2));
      });

    },

    terminate_ec2: function () {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.terminate'), 'danger').done(function () {
        ec2.terminate_ec2()
          .done(alert_success(function () {
            require('infrastructures/show_infra.js').show_infra(infra.id);
          }))
          .fail(alert_danger(self._show_ec2));
      });

    },

    _cook: function (method_name, params) {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);

      var dfd = ec2[method_name](params);
      dfd.fail(
        // cook start fail
        alert_danger(self._show_ec2)
      ).progress(function (state, msg) {
        // cook start success
        if(state !== 'start'){return;}

        alert_success(function () {
          self.inprogress = true;
          Vue.nextTick(function () {
            self.watch_cook(dfd);
          });
        })(msg);
      });
    },

    watch_cook: function (dfd) {
      var self = this;
      var el = document.getElementById("cook-status");

      // 更新されるたびにスクロールすると、scrollHeight 等が重い処理なのでブラウザが固まってしまう。
      // そのため、100msに1回スクロールするようにしている。
      (function () {
        var scroll = function () {
          Vue.nextTick(function () {
            el.scrollTop = el.scrollHeight;
            if (self.inprogress) { setTimeout(scroll, 100); }
          });
        };
        scroll();
      })();

      dfd.done(function () {
        // cook end
        self.chef_console_text = '';
        self.inprogress = false;
        self._show_ec2();
      }).progress(function (state, msg) {
        if (state !== 'update') {return;}

        self.chef_console_text += msg;
      });
    },

    apply_dish: function () {
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, this.physical_id);
      ec2.apply_dish(this.selected_dish)
        .done(alert_success(this._show_ec2))
        .fail(alert_danger(this._show_ec2));
    },

    cook:       function (params) { this._cook('cook', params); },

    yum_update: function (security, exec) {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);

      var security_bool = (security === "security");
      var exec_bool = (exec === "exec");

      modal.Confirm(t('infrastructures.infrastructure'), t('nodes.msg.yum_update_confirm'), 'danger').done(function () {
        var dfd = ec2.yum_update(security_bool, exec_bool).fail(
          // cook start fail
          alert_danger(self._show_ec2)
        ).progress(function (state, msg) {
          // cook start success
          if(state !== 'start'){return;}

          alert_success(function () {
            self.inprogress = true;
            Vue.nextTick(function () {
              self.watch_cook(dfd);
            });
          })(msg);
        });
      });
    },

    edit_runlist: function () {
      this.$parent.tabpaneID = 'edit_runlist';
      this._loading();
    },
    edit_attr: function () {
      this.$parent.tabpaneID = 'edit_attr';
      this._loading();
    },
    select_serverspec: function () {
      this.$parent.tabpaneID = 'serverspec';
      this._loading();
    },
    serverspec_results: function() {
      this.$parent.tabpaneID = 'serverspec_results';
      this._loading();
    },
    view_rules: function () {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.ec2.security_groups;
      this._loading();
      this.$parent.instance_type = 'ec2';
    },

    _show_ec2: function () { this.$parent.show_ec2(this.physical_id); },

    _label_class: function (status) {
      if ( status === 'Success') {
        return 'label-success';
      } else if (status === 'Failed') {
        return 'label-danger';
      } else if (status === 'UnExecuted') {
        return 'label-warning';
      } else { // InProgress, Pending and others.
        return 'label-default';
      }
    },

    is_role:      function (run) { return run.indexOf("role") !== -1; },
    is_first:     function (idx) { return (idx === 0); },
    runlist_type: function (run) { return run.replace(/\[.+\]$/, ""); },
    runlist_name: function (run) { return run.replace(/^.+\[(.+)\]$/, "$1"); },

    _loading: function () { this.$parent.loading = true; },

    change_scale: function () {
      var self = this;
      self.loading = true;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      ec2.change_scale(self.change_scale_type_to).done(function (msg) {
        alert_success(self._show_ec2)(msg);
        $('#change-scale-modal').modal('hide');
      }).fail(function (msg) {
        alert_danger(self._show_ec2)(msg);
        $('#change-scale-modal').modal('hide');
      });
    },

    change_schedule: function () {
      switch (this.schedule_type) {
      case 'yum':
        this.change_yum_schedule();
        break;
      case 'snapshot':
        this.change_snapshot_schedule();
        break;
      }
    },

    change_yum_schedule: function () {
      var self = this;
      self.loading_s = true;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      ec2.schedule_yum(self.schedule).done(function (msg) {
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alert_success()(msg);
      }).fail(function (msg) {
        self.loading_s = false;
        alert_danger()(msg);
      });
    },

    change_snapshot_schedule: function () {
      var self = this;
      self.loading_s = true;
      var s = new Snapshot(this.infra_id);
      s.schedule(self.volume_selected, self.physical_id, self.schedule).done(function (msg) {
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alert_success()(msg);
      }).fail(function (msg) {
        self.loading_s = false;
        alert_danger()(msg);
      });
    },

    is_root_device: function (device_name) {
      return this.ec2.root_device_name === device_name;
    },

    create_snapshot: function (volume_id) {
      var self = this;
      modal.Confirm(t('snapshots.create_snapshot'), t('snapshots.msg.create_snapshot', {volume_id: volume_id})).done(function () {
        var snapshot = new Snapshot(self.infra_id);

        snapshot.create(volume_id, self.physical_id).progress(function (data) {
          modal.Alert(t('snapshots.snapshots'), t('snapshots.msg.creation_started'));
        }).done(self.load_snapshots)
          .fail(alert_danger());

        self.load_snapshots();
      });
    },

    open_schedule_modal: function () { $('#change-schedule-modal').modal('show'); },

    open_yum_schedule_modal: function () {
      this.schedule_type = "yum";
      this.schedule = this.ec2.yum_schedule;
      this.open_schedule_modal();
    },
    open_snapshot_schedule_modal: function (volume_id) {
      this.schedule_type = "snapshot";
      this.schedule = this.ec2.snapshot_schedules[volume_id];
      this.open_schedule_modal();
    },

    load_snapshots: function () {
      var self = this;
      var snapshot = new Snapshot(this.infra_id);
      this.loading_snapshots = true;
      snapshot.index(this.volume_selected).done(function (data) {
        self.snapshots = _.map(data.snapshots, function (s) {
          s.selected = false;
          return s;
        });
        self.sort_key = '';
        self.sort_by('start_time');
        self.loading_snapshots = false;
      }).fail(alert_danger());
    },

    delete_selected_snapshots: function () {
      var self = this;
      var snapshots    = _.select(this.snapshots, 'selected', true);
      var snapshot_ids = _.pluck(snapshots, 'snapshot_id');
      var confirm_body = t('snapshots.msg.delete_snapshot') + '<br>- ' + snapshot_ids.join('<br>- ');
      modal.Confirm(t('snapshots.delete_snapshot'), confirm_body, 'danger').done(function () {
        var s = new Snapshot(self.infra_id);

        _.each(snapshots, function (snapshot) {
          s.destroy(snapshot.snapshot_id)
            .done(function (msg) {
              self.snapshots.$remove(snapshot);
            })
            .fail(alert_danger());
        });
      });
    },

    snapshot_status: function (snapshot) {
      if (snapshot.state === 'pending') {
        return snapshot.state + '(' + snapshot.progress + ')';
      }
      return snapshot.state;
    },

    sort_by: function (key) {
      if (this.sort_key === key) {
        this.sort_asc = !this.sort_asc;
      } else {
        this.sort_asc = false;
        this.sort_key = key;
      }
      this.snapshots = _.sortByOrder(this.snapshots, key, this.sort_asc);
    },

    sorting_by: function (key) {
      return this.sort_key === key;
    },

    load_volumes: function () {
      if ($("#attachButton.dropdown.open").length) {return;}
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      this.loading_volumes = true;
      ec2.attachable_volumes(this.ec2.availability_zone).done(function (data) {
        self.attachable_volumes = data.attachable_volumes;
        self.loading_volumes = false;
      });
    },

    attach_volume: function (volume_id) {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, self.physical_id);
      modal.Prompt(t('ec2_instances.set_device_name'), t('ec2_instances.device_name')).done(function (device_name) {
        ec2.attach_volume(volume_id, device_name).done(function (data) {
          modal.Alert(t('infrastructures.infrastructure'), t('ec2_instances.msg.volume_attached', data)).done(self._show_ec2);
        });
      });
      $("[id^=bootstrap_prompt_]").val(this.suggest_device_name);
    },

    edit_retention_policy: function () {
      var self = this;
      if (Object.keys(self.ec2.retention_policies).includes(self.volume_selected)) {
        self.editing_policy = self.ec2.retention_policies[self.volume_selected];
        self.$set('editing_policy.enabled', true);
      }
      else {
        self.editing_policy = {};
      }
    },

    save_retention_policy: function (volume_id, enabled, max_amount) {
      var self = this;
      var retention_policies = this.ec2.retention_policies;
      var infra = new Infrastructure(this.infra_id);
      var snapshot = new Snapshot(infra.id);
      snapshot.save_retention_policy(volume_id, enabled, max_amount)
        .done(function (msg) {
          if (enabled) {
            retention_policies[volume_id] = self.editing_policy;
          }
          else {
            delete retention_policies[volume_id];
          }
          $('#retention-policy-modal').modal('hide');
          alert_success()(msg);
        }).fail(alert_danger());
    },

    on_click_volume: function (volume_id) {
      var panel_opened = document.getElementById('ebs_panel').classList.contains('in');
      var same = this.volume_selected == volume_id;
      this.volume_selected = volume_id;
      if (panel_opened) {
        if (same) {
          $('#ebs_panel').collapse('hide');
        } else {
          this.load_snapshots();
        }
      } else {
        if (!same) {
          this.load_snapshots();
        }
        $('#ebs_panel').collapse('show');
      }
    },

    toLocaleString: toLocaleString,
    capitalize: function (str) {return _.capitalize(_.camelCase(str));},

    get_security_groups: function (){
      var self = this;
      self.loading_groups = true;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, this.physical_id);
      ec2.get_security_groups().done(function (data) {
        self.rules_summary = data.params;
        self.loading_groups = false;
        self.filteredLength = data.params.length;
      });
    },

    check: function (i) { i.checked= !i.checked; },
    reload: function(){ this.$parent.show_ec2(this.physical_id); },

    submit_groups: function(){
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, this.physical_id);
      var group_ids = this.rules_summary.filter(function (t) {
        return t.checked;
      }).map(function (t) {
        return t.group_id;
      });

      ec2.submit_groups(group_ids)
        .done(alert_success(self._show_ec2))
        .fail(alert_danger(self._show_ec2));

    },

    showPrev: function (){
      if(this.isStartPage) return;
      this.page--;
    },
    showNext: function (){
      if(this.isEndPage) return;
      this.page++;
    },
    check_tag: function(r){
      check_tag(r);
    },
    has_selected: has_selected(this.rules_summary),
  },

  computed: {
    ec2_btn_class: function () {
      if (this.running) {
        return 'btn-success';
      }
      return 'btn-default';
    },

    cook_status_class:       function () { return this._label_class(this.cook_status); },
    serverspec_status_class: function () { return this._label_class(this.serverspec_status); },
    update_status_class:     function () { return this._label_class(this.update_status); },

    cook_status:       function () { return this.capitalize(this.ec2.info.cook_status.value); },
    serverspec_status: function () { return this.capitalize(this.ec2.info.serverspec_status.value); },
    update_status:     function () { return this.capitalize(this.ec2.info.update_status.value); },

    cook_time:       function () { return this.cook_status       === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.cook_status.updated_at);},
    serverspec_time: function () { return this.serverspec_status === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.serverspec_status.updated_at);},
    update_time:     function () { return this.update_status     === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.update_status.updated_at);},

    runlist_empty: function () { return _.isEmpty(this.ec2.runlist); },
    dishes_empty:  function () { return _.isEmpty(this.ec2.dishes); },

    running: function () { return this.ec2.status === 'running'; },
    stopped: function () { return this.ec2.status === 'stopped'; },

    dish_option: function () { return [{text: 'Select!', value: '0'}].concat(this.ec2.dishes.map(function (dish) {
      return {text: dish.name, value: dish.id};
    }));},

    next_run:    function () { return (new Date().getHours() + parseInt(this.schedule.time, 10)) % 24; },

    filled_all:  function () {
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

    selected_any: function () { return _.any(this.snapshots, 'selected', true); },

    suggest_device_name: function () {
      // TODO: iikanji ni sitai
      var suggested_device_letter_code = 102; // same as aws default 'f'
      var device_letter_codes = _(this.ec2.block_devices).chain()
        .pluck('device_name')
        .map(function (name) {
          if (/sd([a-z])$/.test(name)) {
            var letter = name.slice(-1);
            if ('a' <= letter && letter <= 'z') {
              return letter.charCodeAt(0);
            } else {
              return false;
            }
          } else {
            return false;
          }
        })
        .filter()
        .sort()
        .value();

      while (device_letter_codes.indexOf(suggested_device_letter_code) !== -1) {
        if (suggested_device_letter_code === 122) { // 'z'
          suggested_device_letter_code = 63;        // '?'
          break;
        }
        suggested_device_letter_code++;
      }

      return '/dev/sd' + String.fromCharCode(suggested_device_letter_code);
    },

    dispItems: function(){
      var startPage = this.page * this.dispItemSize;
      if (this.filterKey === ''){
        return this.rules_summary.slice(startPage, startPage + this.dispItemSize);
      }
      else{
        return this.rules_summary;
      }
    },

    isStartPage: function(){ return (this.page === 0); },
    isEndPage: function(){ return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length); }
  },

  ready: function () {
    var self = this;
    console.log(self);

    var infra = new Infrastructure(this.infra_id);
    var ec2 = new EC2Instance(infra, this.physical_id);
    ec2.show().done(function (data) {
      self.ec2 = data;
      self.max_sec_group = data.security_groups.length-1;
      var dish_id = '0';
      if (self.ec2.selected_dish) {
        dish_id = self.ec2.selected_dish.id;
      }
      self.selected_dish = dish_id;

      self.$watch('selected_dish', function (dish_id) {
        var dish = new Dish();
        dish.runlist(dish_id).done(function (runlist) {
          self.ec2.runlist = runlist;
        });
      });

      if (self.ec2.info.cook_status === 'InProgress' || self.ec2.info.update_status === 'InProgress') {
        var dfd = $.Deferred();
        ec2.watch_cook(dfd);  // watch WebSocket and trigger event.
        self.watch_cook(dfd); // watch dfd event and update DOM.
        self.inprogress = true;
      }
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));
  },

  filters: {
    zero_as_null: function (str) { return (str === 0) ? null : str; },
    roundup: function (val) { return (Math.ceil(val));},
    count: function (arr) {
      // record length
      this.$set('filteredLength', arr.length);
      // return it intact
      return arr;
    },
  },
});
