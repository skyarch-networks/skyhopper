const queryString = require('query-string').parse(window.location.search);
const Infrastructure = require('../models/infrastructure').default;
const RDSInstance = require('../models/rds_instance').default;

const helpers = require('../infrastructures/helper.js');

const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;
const alertAndShowInfra = helpers.alert_and_show_infra;

const methods = require('../infrastructures/common-methods');

const checkTag = methods.check_tag;

const modal = require('../modal');

module.exports = Vue.extend({
  template: '#rds-tabpane-template',

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
      rds: {},
      serverspec: {},
      rules_summary: null,
      lang: queryString.lang,
      address: null,
      change_scale_type_to: null,
      page: 0,
      dispItemSize: 10,
      filteredLength: null,
      filterKey: '',
      modifying: false,
      loading_groups: '',
      loading_s: false,
    };
  },

  methods: {
    change_scale() {
      const self = this;

      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      rds.change_scale(this.change_scale_type_to)
        .done(self.reload)
        .fail(alertDanger(self.reload));

      $('#change-scale-modal').modal('hide');
    },

    gen_serverspec() {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      rds.gen_serverspec(this.serverspec).done((msg) => {
        alertSuccess(self.reload)(msg);
        $('#rds-serverspec-modal').modal('hide');
      }).fail((msg) => {
        alertDanger(self.reload)(msg);
        $('#rds-serverspec-modal').modal('hide');
      });
    },

    reload() { this.$parent.show_rds(this.physical_id); },

    view_rules() {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.rules_summary;
      this.$parent.instance_type = 'rds';
    },

    submit_groups() {
      if (this.modifying) { return; }
      this.modifying = true;

      const self = this;
      const rds = new RDSInstance(new Infrastructure(this.infra_id), this.physical_id);
      const groupIds = this.rules_summary.filter(t => t.checked).map(t => t.group_id);

      rds.rds_submit_groups(groupIds, self.physical_id)
        .done(alertSuccess(self.reload))
        .fail(alertDanger(self.reload));
    },

    check(i) {
      i.checked = !i.checked;
    },
    showPrev() {
      if (this.isStartPage) return;
      this.page -= 1;
    },
    showNext() {
      if (this.isEndPage) return;
      this.page += 1;
    },
    check_tag(r) {
      checkTag(r);
    },
    has_selected(arg) {
      if (arg) {
        return arg.some(c => c.checked);
      }
      return undefined;
    },
    start_rds() {
      if (this.available) { return; }
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_start_rds')).done(() => {
        rds.start_rds().done((data) => {
          self.reload();
          alertSuccess()(data.message);
        }).fail(alertDanger());
      });
    },
    stop_rds() {
      if (this.stopped) { return; }
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_stop_rds'), 'warning').done(() => {
        rds.stop_rds().done((data) => {
          self.reload();
          alertSuccess()(data.message);
        }).fail(alertDanger());
      });
    },
    reboot_rds() {
      if (this.stopped) { return; }
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_reboot_rds'), 'warning').done(() => {
        rds.reboot_rds().done((data) => {
          self.reload();
          alertSuccess()(data.message);
        }).fail(alertDanger());
      });
    },
    roundup(val) { return (Math.ceil(val)); },
  },
  computed: {
    gen_serverspec_enable() {
      const s = this.serverspec;
      return !!(s.username && s.password && s.database);
    },
    available() { return this.rds.db_instance_status === 'available'; },
    stopped() { return this.rds.db_instance_status === 'stopped'; },
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

    isStartPage() { return (this.page === 0); },
    isEndPage() { return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length); },
    rds_button_class() {
      if (this.modifying) {
        return 'disabled';
      }
      if (this.available) {
        return 'btn-success';
      }
      return 'btn-default';
    },
    changing_status() {
      return t(`rds.msg.${this.rds.db_instance_status}`);
    },
  },

  mounted() {
    this.$nextTick(() => {
      const self = this;
      const infra = new Infrastructure(this.infra_id);
      const rds = new RDSInstance(infra, this.physical_id);
      rds.show().done((data) => {
        self.rds = data.rds;
        self.address = self.rds.endpoint.address;
        self.rules_summary = data.security_groups;
        if (self.rds.pending_modified_values.db_instance_class) {
          self.rds.db_instance_status = 'modifying';
        }
        if (self.rds.db_instance_status === 'modifying' || self.rds.db_instance_status === 'stopping' || self.rds.db_instance_status === 'starting') {
          setTimeout(() => {
            self.reload();
          }, 15000);
          self.modifying = true;
        }
        self.$parent.loading = false;
      }).fail(alertAndShowInfra(infra.id));
    });
  },
  filters: {
    count(arr) {
      // record length
      this.$set('filteredLength', arr.length);
      // return it intact
      return arr;
    },
  },
});
