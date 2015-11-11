/// <reference path="../../declares.d.ts" />

export default Vue.extend({
  template: '#arg-li-template',
  el: () => {return document.createElement('div'); },
  props: {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
      twoWay: true,
    },
  },
});
