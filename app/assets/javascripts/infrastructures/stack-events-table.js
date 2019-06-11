const { toLocaleString } = require('./helper.js');

module.exports = Vue.extend({
  props: {
    events: Array,
    enable_sort: Boolean,
  },
  template: '#stack-events-table-template',
  data() {
    return {
      sortKey: '',
      sortOrders: {
        time: 1,
        type: 1,
        logical: 1,
        status: 1,
        reason: 1,
      },
    };
  },
  methods: {
    event_tr_class(status) {
      if (status === 'CREATE_COMPLETE') { return 'success'; }
      if (status.indexOf('FAILED') !== -1) { return 'danger'; }
      if (status.indexOf('DELETE') !== -1) { return 'warning'; }
      return '';
    },
    toLocaleString,
    sortBy(key) {
      if (!this.enable_sort) {
        return;
      }
      this.sortKey = key;
      this.sortOrders[key] = this.sortOrders[key] * -1;
    },
  },
  computed: {
    sorted_events() {
      if (this.sortKey === '') {
        return this.events;
      }
      const listOrderByAsc = _.sortBy(this.events, this.sortKey);
      if (this.sortOrders[this.sortKey] < 0) {
        return listOrderByAsc.reverse();
      }
      return listOrderByAsc;
    },
  },
  created() {
    const self = this;
    this.$watch('events', () => {
      $(self.$el).hide().fadeIn(800);
    });
  },
});
