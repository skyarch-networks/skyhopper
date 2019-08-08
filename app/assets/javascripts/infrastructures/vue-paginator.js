module.exports = Vue.extend({
  props: {
    page: {
      type: Object,
      required: true,
    },
  },
  template: '#vue-paginator-template',
  methods: {
    isDisable(i) {
      if (this.page.current <= i) {
        return this.page.current === this.page.max;
      }
      return this.page.current === 1;
    },
    visibleTruncate(type) {
      if (type === 'next') {
        return this.page.current + 4 < this.page.max;
      } // 'prev'
      return this.page.current - 5 > 0;
    },
    show(page) {
      if (this.isDisable(page)) { return; }

      this.$dispatch('show', page);
    },
  },
  computed: {
    visibleNum() {
      const self = this;
      return [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => {
        const i = n + self.page.current - 4;
        return i > 0 && i <= self.page.max;
      });
    },
  },
  created() {},
});
