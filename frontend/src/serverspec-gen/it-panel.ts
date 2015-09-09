/// <reference path="../../declares.d.ts" />

export default Vue.extend({
  template: '#it-panel-template',
  el: () => {return document.createElement('div'); },
  props: {
    it: {
      type: Object,
      twoWay: true,
      required: true,
    },
    idx: {
      type: Number,
      required: true,
    }
  },
  ready: function() {
    console.log(this);
  },
});
