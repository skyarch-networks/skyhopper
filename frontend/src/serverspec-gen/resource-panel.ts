/// <reference path="../../declares.d.ts" />

import * as ASTInterface from './ast-interface';

export default Vue.extend({
  template: '#resource-panel-template',
  el: () => { return document.createElement('div'); },
  props: {
    desc: {
      type: Object,
      twoWay: true,
      required: true,
    },
    serverspec_info: {
      type: Object,
      required: true,
    },
  },
  methods: {
    addIt: function () {
      this.desc.body.push({
        type: 'it',
        should: true,
        matcher: {name: 'be_', args: [], chains: []},
      });
    },

    addIts: function () {
      this.desc.body.push({
        type: 'its',
        name: "",
        should: true,
        matcher: {name: 'be_', args: [], chains: []},
      });
    },

    removeIt: function(it: ASTInterface.It|ASTInterface.Its) {
      this.desc.body.$remove(it);
    },

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
    title: function () {
      return this.desc.name === '' ? this.desc.resourceType : `${this.desc.resourceType}(${this.desc.name})`;
    },

    // return [{text: TYPE, value: TYPE}, ...]
    resourceTypes: function () {
      return _.keys(this.serverspec_info);
    },

    // return selected resource info
    resource: function () {
      return this.serverspec_info[this.desc.resourceType];
    },
  },
  ready: function() {
    console.log(this);
  }
});
