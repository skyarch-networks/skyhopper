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
  },
  methods: {
  },
  computed: {
  },
  ready: function() {
    console.log(this);
  },
});
