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
  methods: {

    // XXX: DRY (resource-panel.ts)
    accordionToggle: function () {
      const el = (<HTMLElement>this.$el).querySelector('.collapse');
      $(el).collapse('toggle');
    },

  },
  ready: function() {
    console.log(this);
  },
});
