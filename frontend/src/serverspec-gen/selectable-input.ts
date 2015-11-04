/// <reference path="../../declares.d.ts" />

export default Vue.extend({
  template: '#selectable-input-template',
  el: () => {return document.createElement('div'); },
  data: () => {return {manual: false, id: _.uniqueId('selectable-input-id-')}; },
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
  },
  ready: function() {
    console.log(this);
  },
});
