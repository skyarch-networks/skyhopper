/// <reference path="../../declares.d.ts" />

import * as ASTInterface from './ast-interface';

Vue.config.debug = true;

export default Vue.extend({
  template: '#it-panel-template',
  el: () => {return document.createElement('div'); },
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

      const up = (<HTMLElement>this.$el).querySelector('.glyphicon-chevron-up');
      const down = (<HTMLElement>this.$el).querySelector('.glyphicon-chevron-down');
      $(up).removeClass("glyphicon-chevron-up");
      $(down).removeClass("glyphicon-chevron-down");
      $(up).addClass("glyphicon-chevron-down");
      $(down).addClass("glyphicon-chevron-up");
    },
  },
  computed: {
    matcher_names:  function () { return _.keys(this.resource.matchers); },

    // for internal
    _matcher:       function () { return this.resource.matchers[this.it.matcher.name]; },

    matcher_chains: function () { return this._matcher ? this._matcher.chains     : []; },
    matcher_params: function () { return this._matcher ? this._matcher.parameters : []; },
  },
  ready: function() {
    this.$watch('matcher_chains', (v: string[]) => {
      this.$set("it.matcher.chains", []);
      v.forEach((name, n) => {
        this.it.matcher.chains.$set(n, {name: name, arg: "poyoyo"});
      });
    });
    console.log("it-panel", this);
  },
});
