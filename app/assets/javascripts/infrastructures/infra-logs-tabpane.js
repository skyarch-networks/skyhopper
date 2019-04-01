const Infrastructure = require('models/infrastructure').default;

const helpers = require('infrastructures/helper.js');

const toLocaleString = helpers.toLocaleString;
const alert_and_show_infra = helpers.alert_and_show_infra;
const ansi_up = require('ansi_up');


module.exports = Vue.extend({
  template: '#infra-logs-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      picked_id: null,
      logs: [],
      page: {},
      sortKey: '',
      sortOrders: {
        'users.email': 1,
        'infrastructure_logs.status': 1,
        'infrastructure_logs.details': 1,
        'infrastructure_logs.created_at': 1,
      },
    };
  },

  components: {
    'vue-paginator': require('./vue-paginator'),
  },

  computed: {
    can_download() {
      return this.picked_id !== null;
    },
  },

  methods: {
    status_class(status) { return status ? 'label-success' : 'label-danger'; },
    status_text(status) { return status ? 'SUCCESS' : 'FAILED'; },
    toLocaleString,
    ansi_up(log) { return ansi_up.ansi_to_html(log); },
    sortBy(key) {
      const self = this;
      self.sortKey = key;
      self.sortOrders[key] = self.sortOrders[key] * -1;
      const infra = new Infrastructure(self.infra_id);
      infra.logs(self.page.current, self.sortKey, self.sortOrders[self.sortKey]).done((data) => {
        self.logs = data.logs;
        self.page = data.page;
      }).fail(alert_and_show_infra(infra.id));
    },
    select_entry(item) {
      this.picked_id = item.id;
    },
    is_select_entry(item) {
      return this.picked_id === item.id;
    },
    download_selected() {
      const infra = new Infrastructure(this.infra_id);
      infra.download_log(this.picked_id);
    },
    download_all() {
      const infra = new Infrastructure(this.infra_id);
      infra.download_logs();
    },
  },

  created() {
    const self = this;
    const infra = new Infrastructure(this.infra_id);
    infra.logs().done((data) => {
      self.logs = data.logs;
      self.page = data.page;
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));

    this.$watch('infra_logs', (newVal, oldVal) => {
      $('.popovermore').popover().click((e) => {
        e.preventDefault();
      });
    });

    this.$on('show', (page) => {
      const infra = new Infrastructure(self.infra_id);
      const sortKey = self.sortKey === '' ? void 0 : self.sortKey;
      infra.logs(page, sortKey, self.sortOrders[self.sortKey]).done((data) => {
        self.logs = data.logs;
        self.page = data.page;
      }).fail(alert_and_show_infra(infra.id));
    });
  },
});
