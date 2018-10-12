var Infrastructure = require('models/infrastructure').default;

var helpers = require('infrastructures/helper.js');
var toLocaleString = helpers.toLocaleString;
var alert_and_show_infra = helpers.alert_and_show_infra;
var ansi_up = require('ansi_up');


module.exports = Vue.extend({
  template: '#infra-logs-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    picked_id: null,
    logs: [],
    page: {},
    sortKey: '',
    sortOrders: {
      'users.email': 1,
      'infrastructure_logs.status': 1,
      'infrastructure_logs.details': 1,
      'infrastructure_logs.created_at': 1
    },
  };},

  components: {
    'vue-paginator': require('./vue-paginator'),
  },

  computed: {
    can_download: function () {
      return this.picked_id !== null;
    },
  },

  methods: {
    status_class: function (status) { return status ? 'label-success' : 'label-danger'; },
    status_text: function (status)  { return status ? 'SUCCESS' : 'FAILED'; },
    toLocaleString: toLocaleString,
    ansi_up: function(log)  { return ansi_up.ansi_to_html(log); },
    sortBy: function (key) {
      var self = this;
      self.sortKey = key;
      self.sortOrders[key] = self.sortOrders[key] * -1;
      var infra = new Infrastructure(self.infra_id);
      infra.logs(self.page.current, self.sortKey, self.sortOrders[self.sortKey]).done(function (data) {
        self.logs = data.logs;
        self.page = data.page;
      }).fail(alert_and_show_infra(infra.id));
    },
    select_entry: function(item)  {
      this.picked_id = item.id;
    },
    is_select_entry: function(item)  {
      return this.picked_id === item.id;
    },
    download_selected: function () {
      var infra = new Infrastructure(this.infra_id);
      infra.download_log(this.picked_id);
    },
    download_all: function () {
      var infra = new Infrastructure(this.infra_id);
      infra.download_logs();
    },
  },

  created: function () {
    var self = this;
    console.log(self);
    var infra = new Infrastructure(this.infra_id);
    infra.logs().done(function (data) {
      self.logs = data.logs;
      self.page = data.page;
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));

    this.$watch('infra_logs', function (newVal, oldVal) {
      $(".popovermore").popover().click( function(e) {
        e.preventDefault();
      });
    });

    this.$on('show', function (page) {
      var infra = new Infrastructure(self.infra_id);
      var sortKey = self.sortKey === '' ? void 0 : self.sortKey;
      infra.logs(page, sortKey, self.sortOrders[self.sortKey]).done(function (data) {
        self.logs = data.logs;
        self.page = data.page;
      }).fail(alert_and_show_infra(infra.id));
    });
  },
});
