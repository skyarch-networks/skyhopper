const Infrastructure = require('models/infrastructure').default;
const EC2Instance = require('models/ec2_instance').default;

const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_danger = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#serverspec-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      individuals: null,
      globals: null,
      loading: false,
      loading_s: false,
      enabled: null,
      frequency: null,
      day_of_week: null,
      time: null,
      checked_auto_generated: null,
    };
  },

  methods: {
    show_ec2() {
      this.$parent.show_ec2(this.physical_id);
    },

    run() {
      const self = this;
      self.loading = true;
      self.ec2.run_serverspec(
        self.globals.concat(self.individuals),
        self.checked_auto_generated,
      ).done((msg) => {
        alert_success(self.show_ec2)(msg);
        self.$parent.update_serverspec_status(self.physical_id);
      }).fail(alert_danger(self.show_ec2));
    },

    change_schedule() {
      const self = this;
      self.loading_s = true;
      self.ec2.schedule_serverspec({
        enabled: self.enabled,
        frequency: self.frequency,
        day_of_week: self.day_of_week,
        time: self.time,
      }).done((msg) => {
        self.loading_s = false;
        $('#change-schedule-modal').modal('hide');
        alert_success()(msg);
      }).fail((msg) => {
        self.loading_s = false;
        alert_danger()(msg);
      });
    },
  },

  computed: {
    physical_id() { return this.$parent.tabpaneGroupID; },
    ec2() { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    can_run() {
      if (this.globals || this.individuals) {
        const all_spec = this.globals.concat(this.individuals);
        return all_spec.find(s => s.checked) || this.checked_auto_generated;
      }
    },


    next_run() { return (new Date().getHours() + parseInt(this.time, 10)) % 24; },

    all_filled() {
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

  created() {
    const self = this;
    self.ec2.select_serverspec().done((data) => {
      const schedule = data.schedule;
      self.individuals = data.individuals || [];
      self.globals = data.globals || [];
      self.enabled = schedule.enabled;
      self.frequency = schedule.frequency;
      self.day_of_week = schedule.day_of_week;
      self.time = schedule.time;

      self.$parent.loading = false;
    }).fail(alert_danger(self.show_ec2));
  },
});
