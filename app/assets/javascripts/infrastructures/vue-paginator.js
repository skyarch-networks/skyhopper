module.exports = Vue.extend({
  props: {
    page: {
      type: Object,
      required: true,
    },
  },
  template: '#vue-paginator-template',
  methods: {
    isDisable: function (i) {
      if (this.page.current <= i) {
        return this.page.current === this.page.max;
      } else {
        return this.page.current === 1;
      }
    },
    visibleTruncate: function (type) {
      if (type === 'next') {
        return this.page.current + 4 < this.page.max ;
      } else { // 'prev'
        return 0 < this.page.current - 5;
      }
    },
    show: function (page) {
      if (this.isDisable(page)){return;}

      this.$dispatch('show', page);
    },
  },
  computed: {
    visibleNum: function () {
      var self = this;
      return _.filter([0, 1, 2, 3, 4, 5, 6, 7, 8], function (n) {
        var i = n + self.page.current - 4;
        return 0 < i && i <= self.page.max;
      });
    },
  },
  created: function () { console.log(this); },
});
