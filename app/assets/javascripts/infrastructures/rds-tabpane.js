var Infrastructure = require('models/infrastructure').default;
var RDSInstance    = require('models/rds_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var alert_and_show_infra = helpers.alert_and_show_infra;

var queryString = require('query-string').parse(location.search);

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
    security_groups: null,
    lang: queryString.lang,
    address: null,
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

    view_rules: function () {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.security_groups;
      this.$parent.instance_type = 'rds';
    },

    rds_submit_groups: function(){
      var self = this;
      var rds = new RDSInstance(new Infrastructure(this.infra_id), this.physical_id);
      var group_ids = this.security_groups.filter(function (t) {
        return t.checked;
      }).map(function (t) {
        return t.group_id;
      });
      var reload = function () {
        self.$parent.show_rds(self.physical_id);
      };

      rds.rds_submit_groups(group_ids, self.physical_id)
        .done(alert_success(reload))
        .fail(alert_danger(reload));

    },

    check: function (i) {
      i.checked= !i.checked;
    },

    has_selected: function() {
      if (this.security_groups){
        return this.security_groups.some(function(c){
          return c.checked;
        });
      }
    },
    check_tag: function (r) {
      if(r.tags){
        return (r.tags[0].key === 'Name');
      }
    },
  },

  computed: {
    gen_serverspec_enable: function () {
      var s = this.serverspec;
      return !!(s.username && s.password && s.database);
    },
    available: function () { return this.rds.db_instance_status === 'available'; },
  },

  created: function () {
    var self = this;
    var infra = new Infrastructure(this.infra_id);
    var rds = new RDSInstance(infra, this.physical_id);
    rds.show().done(function (data) {
      self.rds = data.rds;
      self.address = self.rds.endpoint.address;
      self.security_groups = data.security_groups;

      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));
  },
});
