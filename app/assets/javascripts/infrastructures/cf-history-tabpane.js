var Infrastructure = require('models/infrastructure').default;
var CFTemplate = require('models/cf_template').default;

var helpers = require('infrastructures/helper.js');
var toLocaleString = helpers.toLocaleString;
var alert_and_show_infra = helpers.alert_and_show_infra;

module.exports = Vue.extend({
  template: '#cf-history-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    id: -1,
    current: null,
    history: [],
  };},

  methods: {
    active: function (id) { return this.id === id; },
    toLocaleString: toLocaleString,

    get: function (id) {
      var self = this;
      self.id = id;

      var infra = new Infrastructure(this.infra_id);
      var cft = new CFTemplate(infra);
      cft.show(id).done(function (data) {
        self.current = data;
      }).fail(alert_and_show_infra(infra.id));
    },
  },
  computed: {
    currentExists: function () { return !!this.current; },
  },
  created: function () {
    var self = this;
    var infra = new Infrastructure(this.infra_id);
    var cft = new CFTemplate(infra);
    cft.history().done(function (data) {
      self.history = data;
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));
  },
});
