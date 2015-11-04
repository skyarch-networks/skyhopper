/// <reference path="../../declares.d.ts" />

export default Vue.extend({
  template: '#selectable-input-template',
  el: () => {return document.createElement('div'); },
  data: () => {return {manual_check: false, id: _.uniqueId('selectable-input-id-')}; },
  props: {
    label: {
      type: String,
      required: true,
    },

    // ['be_hoge', 'be_fuga', ...]
    options: {
      type: Array,
      required: true,
    },

    // selected option
    selected: {
      type: String,
      twoWay: true,
      required: true,
    },
  },
  methods: {

  },
  computed: {
    opt: function () {
      return this.options.map((o: string) => {return {text: o, value: o}; });
    },
    manual: function () {
      return this.manual_check || this.force_manual;
    },
    force_manual: function () { return this.options.length === 0; },
  },
  ready: function() {
    if (!this.force_manual) {
      this.selected = this.options[0];
    }
    console.log(this);
  },
});
