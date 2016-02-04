module.exports = Vue.extend({
  props: { events: Array, },
  template: '#stack-events-table-template',
  methods: {
    event_tr_class: function (status) {
      if      (status === "CREATE_COMPLETE")    { return "success"; }
      else if (status.indexOf("FAILED") !== -1) { return "danger"; }
      else if (status.indexOf("DELETE") !== -1) { return "warning"; }
      return '';
    },
    toLocaleString: toLocaleString,
  },
  created: function () {
    var self = this;
    console.log(self);
    this.$watch('events', function () {
      $(self.$el).hide().fadeIn(800);
    });
  },
});
