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
    logs: [],
    page: {},
  };},

  components: {
    'vue-paginator': require('./vue-paginator'),
  },

  methods: {
    status_class: function (status) { return status ? 'label-success' : 'label-danger'; },
    status_text: function (status)  { return status ? 'SUCCESS' : 'FAILED'; },
    toLocaleString: toLocaleString,
    ansi_up: function(log)  { return ansi_up.ansi_to_html(log); }
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
      infra.logs(page).done(function (data) {
        self.logs = data.logs;
        self.page = data.page;
      }).fail(alert_and_show_infra(infra.id));
    });
  },
});
