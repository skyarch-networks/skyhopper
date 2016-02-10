var Infrastructure = require('models/infrastructure').default;
var RDSInstance    = require('models/rds_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var alert_and_show_infra = helpers.alert_and_show_infra;

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

  data: function () {return {
    rds: {},
    serverspec: {},
  };},

  methods: {
    change_scale: function () {
      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      rds.change_scale(this.change_scale_type_to).done(function (msg) {
        alert_success(self.reload)(msg);
        $('#change-scale-modal').modal('hide');
      }).fail(function (msg) {
        alert_danger(self.reload)(msg);
        $('#change-scale-modal').modal('hide');
      });
    },

    gen_serverspec: function () {
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      rds.gen_serverspec(this.serverspec).done(function (msg) {
        alert_success(self.reload)(msg);
        $('#rds-serverspec-modal').modal('hide');
      }).fail(function (msg) {
        alert_danger(self.reload)(msg);
        $('#rds-serverspec-modal').modal('hide');
      });
    },

    reload: function () { this.$parent.show_rds(this.physical_id); },
  },
  computed: {
    gen_serverspec_enable: function () {
      var s = this.serverspec;
      return !!(s.username && s.password && s.database);
    },
  },
  created: function () {
    var self = this;
    var infra = new Infrastructure(this.infra_id);
    var rds = new RDSInstance(infra, this.physical_id);
    rds.show().done(function (data) {
      self.rds = data.rds;
      self.$parent.loading = false;
    }).fail(alert_and_show_infra);
  },
});
