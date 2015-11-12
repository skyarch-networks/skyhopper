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
    const update_chains = (names: string[]) => {
      this.it.matcher.chains = names.map( name => ({name, arg: "", use: false}));
    };
    update_chains(this.matcher_chains);
    this.$watch('matcher_chains', update_chains);

    const update_params = (names: string[]) => {
      this.it.matcher.args = names.map( __ => "" );
    };
    update_params(this.matcher_params);
    this.$watch('matcher_params', update_params);

    console.log("it-panel", this);
  },
});
