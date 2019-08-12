const Infrastructure = require('../models/infrastructure').default;
const Monitoring = require('../models/monitoring').default;

const helpers = require('../infrastructures/helper.js');

const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;
const alertAndShowInfra = helpers.alert_and_show_infra;
const modal = require('../modal');

module.exports = Vue.extend({
  template: '#edit-monitoring-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      master_monitorings: [],
      selected_monitoring_ids: [],
      web_scenarios: [],
      mysql_rds_host: null,
      postgresql_rds_host: null,
      add_scenario: {},
      loading: false,
      temp_loading: false,
      zb_loading: false,
      display_zb_server: false,
      page: 0,
      dispItemSize: 10,
      templates: [],
      linked_resources: [],
      before_register: false,
      sel_resource: null,
    };
  },

  methods: {
    type(master) { return Monitoring.type(master); },

    edit_temp(resource) {
      this.sel_resource = resource;
      this.templates = resource.templates;
    },

    delete_step(step) {
      this.web_scenarios = this.web_scenarios.filter(s => s[0] !== step[0]);
    },

    add_step_err() {
      const s = this.add_scenario;
      if (s.scenario_name && !s.scenario_name.match(/^[\w\s]+$/)) {
        return 'scenario_name can not contain signs';
      }
      if (s.status_code && !s.status_code.match(/^[0-9]+$/)) {
        return 'status code は半角数字でお願いします';
      }
      if (s.timeout && !s.timeout.match(/^[0-9]+$/)) {
        return 'Timeout は半角数字でお願いします';
      }
      const scenario = [s.scenario_name, s.step_name, s.url, s.required_string, s.status_code, s.timeout];
      if (!scenario.every(x => x && !(x.match(/^\s*$/)))) {
        return 'Please fill in the blanks';
      }

      return null;
    },

    add_step() {
      const scenario = [
        this.add_scenario.scenario_name,
        this.add_scenario.step_name,
        this.add_scenario.url,
        this.add_scenario.required_string,
        this.add_scenario.status_code,
        this.add_scenario.timeout,
      ];

      const sArray = $.map(scenario, s => (s.trim()));

      this.web_scenarios.push(sArray);
      this.add_scenario = {};
    },

    submit() {
      // this.$event.preventDefault();
      this.loading = true;
      const self = this;
      this.monitoring.update(
        this.master_monitorings,
        this.web_scenarios,
        this.mysql_rds_host,
        this.postgresql_rds_host,
      ).done(alertSuccess(() => {
        self.$parent.show_monitoring();
      }))
        .fail(alertDanger(() => {
          self.loading = false;
        }));
    },

    update_templates() {
      if (!this.has_selected) { return; }
      const self = this;
      const templates = this.templates.filter(t => t.checked).map(t => t.name).value();
      self.temp_loading = true;
      this.monitoring.update_templates(self.sel_resource.resource, templates).done(() => {
        self.temp_loading = false;
        self.$parent.show_edit_monitoring();
      }).fail(alertAndShowInfra(this.infra_id));
    },

    roundup(val) { return (Math.ceil(val)); },

    showPrev() {
      if (this.isStartPage) return;
      this.page -= 1;
    },

    showNext() {
      if (this.isEndPage) return;
      this.page += 1;
    },
    select_server(z) {
      if (z.is_checked) { return; }
      const self = this;
      modal.Confirm(t('monitoring.title'), t('monitoring.msg.change_zabbix'), 'warning').done(() => {
        self.zb_loading = true;
        self.monitoring.change_zabbix_server(z.id).done(() => {
          self.temp_loading = false;
          self.$parent.show_edit_monitoring();
        }).fail(alertAndShowInfra(this.infra_id));
      });
    },
  },

  computed: {
    monitoring() { return new Monitoring(new Infrastructure(this.infra_id)); },

    has_selected() {
      return this.templates.some(c => c.checked);
    },

    dispItems() {
      const startPage = this.page * this.dispItemSize;
      return this.templates.slice(startPage, startPage + this.dispItemSize);
    },

    isStartPage() { return (this.page === 0); },
    isEndPage() { return ((this.page + 1) * this.dispItemSize >= this.templates.length); },
  },

  created() {
    const self = this;
    self.temp_loading = true;
    this.monitoring.edit().done((data) => {
      self.master_monitorings = data.master_monitorings;
      self.selected_monitoring_ids = data.selected_monitoring_ids;
      self.web_scenarios = data.web_scenarios;
      self.mysql_rds_host = null;
      self.postgresql_rds_host = null;
      self.zabbix_servers = data.zabbix_servers;

      self.$parent.loading = false;

      // Call Show only if monitoring edit call is successfull
      this.monitoring.show().done(() => {
        self.before_register = data.before_register;
        self.linked_resources = data.linked_resources;
        self.$parent.loading = false;
        self.temp_loading = false;
      }).fail(alertAndShowInfra(this.infra_id));
    }).fail((xhr) => {
      if (xhr.status === 400) { // before register zabbix
        self.$parent.show_monitoring();
      } else {
        alertAndShowInfra(self.infra_id)(xhr.responseText);
      }
    });
  },

  filters: {

  },
});
