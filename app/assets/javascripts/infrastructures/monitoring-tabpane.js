const Infrastructure = require('models/infrastructure').default;
const Monitoring = require('models/monitoring').default;

const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_and_show_infra = helpers.alert_and_show_infra;

google.load('visualization', '1.0', { packages: ['corechart'] });

// TODO: .active をつける
module.exports = Vue.extend({
  template: '#monitoring-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      problems: null,
      creating: false,
      before_register: false,
      commons: [],
      uncommons: [],
      resources: [],
      templates: [],
      error_message: null,
      loading_graph: false,
      url_status: [],
      showing_url: false,
      loading_problems: true,
      loading: false,
      page: 0,
      dispItemSize: 10,
      show_range: false,
      dt: null,
      dt2: null,
      physical_id: null,
      item_id: null,
    };
  },

  methods: {
    show_problems() {
      const self = this;
      this.monitoring.show_problems().done((data) => {
        self.problems = data;
        self.loading_problems = false;
      });
    },

    roundup(val) { return (Math.ceil(val)); },

    create() {
      if (!this.has_selected) { return; }

      const self = this;
      self.creating = true;
      const templates = _(this.templates).filter(t => t.checked).map(t => t.name).value();

      this.monitoring.create_host(templates).done(() => {
        alert_success(() => {
          self.$parent.show_edit_monitoring();
        })(t('monitoring.msg.created'));
      }).fail(alert_and_show_infra(this.infra_id));
    },

    show_url() {
      const self = this;
      self.loading_graph = true;
      this.monitoring.show_url().done((data) => {
        // TODO: data が空の場合にエラー表示する
        // TODO: ポーリング
        self.url_status = data;
        self.error_message = null;
        self.loading_graph = false;
        self.showing_url = true;
      }).fail(alert_and_show_infra(this.infra_id));
    },

    showDate() {
      const self = this;
      self.loading_graph = true;
      if (!(this.dt && this.dt2)) { return; }

      const dates = [this.dt, this.dt2];
      this.monitoring.show_zabbix_graph(self.physical_id, self.item_key, dates).done((data) => {
        self.loading_graph = false;
        Vue.nextTick(() => {
          if (data.length === 0) {
            self.error_message = t('monitoring.msg.no_data');
          } else {
            self.error_message = null;
            self.drawChart(data, self.physical_id, self.item_key, ['value']);
          }
        });
      }).fail(alert_and_show_infra(this.infra_id));
    },

    drawChart(data, physical_id, title_name, columns) {
      const resizable_data = new google.visualization.DataTable();
      let direction;
      if (columns.length === 1) {
        resizable_data.addColumn('datetime', 'DateTime');
        _.forEach(columns, (col) => {
          resizable_data.addColumn('number', col);
        });
        const zabbix_data = data.map((obj, i) => {
          const format_date = new Date(obj[0]);
          return [format_date, obj[1]];
        });
        resizable_data.addRows(zabbix_data);
        resizable_data.sort([{ column: 0, asc: true }]);
        direction = 1;
      } else {
        resizable_data.addColumn('string', 'clock');
        _.forEach(columns, (col) => {
          resizable_data.addColumn('number', col);
        });
        resizable_data.addRows(data);
        direction = -1;
      }
      const resizable_options = {
        title: `${physical_id} ${title_name}`,
        titleTextStyle: {
          fontSize: 15,
          fontName: 'Meiryo',
        },
        chartArea: {
          width: '90%',
          height: '70%',
        },
        fontSize: 11,
        // setting labels 45 degrees
        hAxis: {
          direction,
          slantedText: true,
          slantedTextAngle: 45,
        },
        // remove negative values
        vAxis: {
          viewWindow: {
            min: 0,
          },
        },
        explorer: {
          axis: 'horizontal',
          // axis: 'vertical'
        },
      };
      if (columns.length === 1) {
        resizable_options.legend = { position: 'none' };
      } else {
        resizable_options.legend = {
          position: 'top',
          alignment: 'center',
        };
      }

      const resizable_chart = new google.visualization.LineChart(document.getElementById('graph'));
      resizable_chart.draw(resizable_data, resizable_options);
    },

    show_zabbix_graph(physical_id, item_key) {
      const self = this;
      self.showing_url = false;
      self.loading_graph = true;
      self.physical_id = physical_id;
      self.item_key = item_key;
      this.monitoring.show_zabbix_graph(physical_id, item_key).done((data) => {
        self.loading_graph = false;
        self.show_range = true;
        Vue.nextTick(() => {
          if (data.length === 0) {
            self.error_message = t('monitoring.msg.no_data');
          } else {
            self.error_message = null;
            self.drawChart(data, physical_id, item_key, ['value']);
          }
        });
      }).fail(alert_and_show_infra(this.infra_id));
    },

    show_cloudwatch_graph(physical_id) {
      const self = this;
      self.showing_url = false;
      self.show_range = false;
      self.loading_graph = true;
      this.monitoring.show_cloudwatch_graph(physical_id).done((data) => {
        self.error_message = null;
        self.loading_graph = false;
        Vue.nextTick(() => {
          self.drawChart(data, physical_id, 'NetworkInOut', ['NetworkIn', 'NetworkOut', 'Sum']);
        });
      }).fail(alert_and_show_infra(this.infra_id));
    },

    showPrev() {
      if (this.isStartPage) return;
      this.page--;
    },

    showNext() {
      if (this.isEndPage) return;
      this.page++;
    },

    close() {
      this.$parent.show_monitoring();
    },
  },
  computed: {
    monitoring() { return new Monitoring(new Infrastructure(this.infra_id)); },
    no_problem() { return _.isEmpty(this.problems); },
    before_setting() { return this.commons.length === 0 && this.uncommons.length === 0; },

    has_selected() {
      return _.some(this.templates, c => c.checked);
    },

    dispItems() {
      const startPage = this.page * this.dispItemSize;
      return this.templates.slice(startPage, startPage + this.dispItemSize);
    },

    isStartPage() { return (this.page === 0); },
    isTo() { return (!this.dt && this.dt !== ''); },
    isShow() { return (!this.dt2 && this.dt2 !== ''); },
    isEndPage() { return ((this.page + 1) * this.dispItemSize >= this.templates.length); },
  },
  created() {
    const self = this;
    const infra = new Infrastructure(this.infra_id);
    const monitoring = new Monitoring(infra);
    monitoring.show().done(function (data) {
      self.before_register = data.before_register;
      self.commons = data.monitor_selected_common;
      self.uncommons = data.monitor_selected_uncommon;
      self.resources = data.resources;
      self.templates = data.templates;

      if (!this.before_register) {
        self.show_problems();
      }
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(this.infra_id));
  },

  filters: {

  },
});
