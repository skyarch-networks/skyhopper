/// <reference path="../../declares.d.ts" />

import * as ASTInterface from './ast-interface';

Vue.config.debug = true;

export default Vue.extend({
  template: '#it-panel-template',
  el: () => {return document.createElement('div'); },
  data: () => {return {down: true}; },
  props: {
    it: {
      type: Object,
      twoWay: true,
      required: true,
    },
    resource: {
      type: Object,
      required: true,
    },
  },
  methods: {
    // XXX: DRY (resource-panel.ts)
    accordionToggle: function () {
      const el = (<HTMLElement>this.$el).querySelector('.collapse');
      $(el).collapse('toggle');

      this.down = !this.down;
    },
  },
  computed: {
    class_up_down: function () {
      return {
        "glyphicon-chevron-down": this.down,
        "glyphicon-chevron-up":  !this.down,
      };
    },

    matcher_names:  function () { return _.keys(this.resource.matchers); },

    // for internal
    _matcher:       function () { return this.resource.matchers[this.it.matcher.name]; },

    matcher_chains: function () { return this._matcher ? this._matcher.chains     : []; },
    matcher_params: function () { return this._matcher ? this._matcher.parameters : []; },

  },
  ready: function() {
    this.$watch('matcher_chains', (names: string[]) => {
      this.it.matcher.chains = names.map( name => ({name, arg: "", use: false}));
    });

    this.$watch('matcher_params', (names: string[]) => {
      this.it.matcher.args = names.map( __ => "" );
    });

    console.log("it-panel", this);
  },
});
