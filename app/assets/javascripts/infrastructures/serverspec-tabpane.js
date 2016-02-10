var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#serverspec-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    available_auto_generated: null,
    individuals: null,
    globals: null,
    loading: false,
    loading_s: false,
    enabled: null,
    frequency: null,
    day_of_week: null,
    time: null,
  };},

  methods: {
    show_ec2: function () {
      this.$parent.show_ec2(this.physical_id);
    },

    run: function () {
      var self = this;
      self.loading = true;
      self.ec2.run_serverspec(
        self.globals.concat(self.individuals),
        self.checked_auto_generated
      ).done(function (msg) {
        alert_success(self.show_ec2)(msg);
        self.$parent.update_serverspec_status(self.physical_id);
      }).fail(alert_danger(self.show_ec2));
    },

    change_schedule: function () {
      var self = this;
      self.loading_s = true;
      self.ec2.schedule_serverspec({
        enabled: self.enabled,
        frequency: self.frequency,
        day_of_week: self.day_of_week,
        time: self.time
      }).done(function (msg) {
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alert_success()(msg);
      }).fail(function (msg) {
        self.loading_s = false;
        alert_danger()(msg);
      });
    }
  },

  computed: {
    physical_id: function () { return this.$parent.tabpaneGroupID; },
    ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    all_spec:    function () { return this.globals.concat(this.individuals); },
    can_run:     function () { return !!_.find(this.all_spec, function(s){return s.checked;}) || this.checked_auto_generated; },
    next_run:    function () { return (new Date().getHours() + parseInt(this.time, 10)) % 24; },

    all_filled:  function () {
      if (!this.enabled) return true;
      switch (this.frequency) {
        case 'weekly':
          return this.day_of_week && this.time;
        case 'daily':
          return this.time;
        case 'intervals':
          return parseInt(this.time, 10);
        default:
          return false;
      }
    },
  },

  created: function () {
    var self = this;
    self.ec2.select_serverspec().done(function (data) {
      var schedule = data.schedule;
      self.available_auto_generated = data.available_auto_generated;
      self.individuals = data.individuals || [];
      self.globals = data.globals || [];
      self.enabled = schedule.enabled;
      self.frequency = schedule.frequency;
      self.day_of_week = schedule.day_of_week;
      self.time = schedule.time;

      self.$parent.loading = false;
    }).fail(alert_danger(self.show_ec2));
  }
});
