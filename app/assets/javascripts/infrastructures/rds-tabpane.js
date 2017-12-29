var modal          = require('modal');
var Infrastructure = require('models/infrastructure').default;
var RDSInstance    = require('models/rds_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var alert_and_show_infra = helpers.alert_and_show_infra;

var methods = require('infrastructures/common-methods');
var has_selected         = methods.has_selected;
var check_tag            = methods.check_tag;

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
    rules_summary: null,
    lang: queryString.lang,
    address: null,
    change_scale_type_to: null,
    page: 0,
    dispItemSize: 10,
    filteredLength: null,
    filterKey: '',
    modifying: false,
  };},

  methods: {
    change_scale: function () {
      var self = this;

      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      rds.change_scale(this.change_scale_type_to)
      .done(alert_success(self.reload))
      .fail(alert_danger(self.reload));

      this.modifying = true;
      $('#change-scale-modal').modal('hide');
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
      this.$parent.sec_group = this.rules_summary;
      this.$parent.instance_type = 'rds';
    },

    submit_groups: function(){
      if (this.modifying) {return;}
      this.modifying = true;

      var self = this;
      var rds = new RDSInstance(new Infrastructure(this.infra_id), this.physical_id);
      var group_ids = this.rules_summary.filter(function (t) {
        return t.checked;
      }).map(function (t) {
        return t.group_id;
      });

      rds.rds_submit_groups(group_ids, self.physical_id)
        .done(alert_success(self.reload))
        .fail(alert_danger(self.reload));
    },

    check: function (i) {
      i.checked= !i.checked;
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
    start_rds: function () {
      if (this.available) { return }
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_start_rds')).done(function () {
        rds.start_rds().done(function (data) {
          self.modifying = true;
          self.rds = data.rds;
          self.reload();
          alert_success()(data.message);
        }).fail(alert_danger());
      });
    },
    stop_rds: function () {
      if (this.stopped) { return }
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_stop_rds'), 'warning').done(function () {
        rds.stop_rds().done(function (data) {
          self.modifying = true;
          self.rds = data.rds;
          self.reload();
          alert_success()(data.message);
        }).fail(alert_danger());
      });
    },
    reboot_rds: function () {
      if (this.stopped) { return }
      var self = this;
      var infra = new Infrastructure(this.infra_id);
      var rds = new RDSInstance(infra, this.physical_id);
      modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.confirm_reboot_rds'), 'warning').done(function () {
        rds.reboot_rds().done(function (data) {
          self.modifying = true;
          self.rds = data.rds;
          self.reload();
          alert_success()(data.message);
        }).fail(alert_danger());
      });
    },
  },
  computed: {
    gen_serverspec_enable: function () {
      var s = this.serverspec;
      return !!(s.username && s.password && s.database);
    },
    available: function () { return this.rds.db_instance_status === 'available'; },
    stopped: function () { return this.rds.db_instance_status === 'stopped'; },
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
    isEndPage: function(){ return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length); },
    rds_button_class: function () {
      if (this.modifying) {
        return 'disabled';
      }
      if (this.available) {
        return 'btn-success';
      }
      return 'btn-default';
    },
    changing_status: function () {
      var t_status = t('infrastructures.' + this.rds.db_instance_status);
      return t('infrastructures.msg.modifying', {status: t_status});
    },
  },

  created: function () {
    var self = this;
    var infra = new Infrastructure(this.infra_id);
    var rds = new RDSInstance(infra, this.physical_id);
    rds.show().done(function (data) {
      self.rds = data.rds;
      self.address = self.rds.endpoint.address;
      self.rules_summary = data.security_groups;
      if(self.rds.db_instance_status == 'modifying' || self.rds.db_instance_status == 'stopping' || self.rds.db_instance_status == 'starting' ){
        setTimeout(function () {
          self.reload();
        }, 15000);
        self.modifying = true;
      }
      self.$parent.loading = false;
    }).fail(alert_and_show_infra(infra.id));
  },
  filters: {
    roundup: function (val) { return (Math.ceil(val));},
    count: function (arr) {
      // record length
      this.$set('filteredLength', arr.length);
      // return it intact
      return arr;
    },
  },
});
