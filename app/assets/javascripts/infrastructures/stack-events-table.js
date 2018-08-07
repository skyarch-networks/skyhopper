var toLocaleString = require('./helper.js').toLocaleString;

module.exports = Vue.extend({
  props: {
    events: Array,
    enable_sort: Boolean,
  },
  template: '#stack-events-table-template',
  data: function() {
    return {
      sortKey: '',
      sortOrders: {
        time: 1,
        type: 1,
        logical: 1,
        status: 1,
        reason: 1,
      },
    }
  },
  methods: {
    event_tr_class: function (status) {
      if      (status === "CREATE_COMPLETE")    { return "success"; }
      else if (status.indexOf("FAILED") !== -1) { return "danger"; }
      else if (status.indexOf("DELETE") !== -1) { return "warning"; }
      return '';
    },
    toLocaleString: toLocaleString,
    sortBy: function (key) {
      if (!this.enable_sort) {
        return;
      }
      this.sortKey = key;
      this.sortOrders[key] = this.sortOrders[key] * -1;
    },
  },
  created: function () {
    var self = this;
    console.log(self);
    this.$watch('events', function () {
      $(self.$el).hide().fadeIn(800);
    });
  },
  filters: {
    powerfulOrderBy: function (list, sortKey, order) {
      if (sortKey === "") {
        return list;
      }
      var listOrderByAsc = _.sortBy(list, sortKey);
      if (order < 0) {
        return listOrderByAsc.reverse();
      }
      return listOrderByAsc;
    }
  },
});
