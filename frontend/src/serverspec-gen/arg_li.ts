/// <reference path="../../declares.d.ts" />

export default Vue.extend({
  template: '#arg-list-template',
  el: () => {return document.createElement('div'); },
  props: {
    args: {
      // [name, name, ...]
      type: Array,
      required: true,
    },
    results: {
      // [{name: String, arg: String}, ...]
      type: Array,
      required: true,
      twoWay: true,
    },
  },

  methods: { },
  computed: { },

  ready: function() {
    (<string[]>this.args).forEach((n, idx) => {
      const v = {name: n, arg: ""};
      this.results[idx] = v;
    });
    console.log(this);
  },
});
