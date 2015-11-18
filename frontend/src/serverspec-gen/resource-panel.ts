/// <reference path="../../declares.d.ts" />

import * as ASTInterface from './ast-interface';

export default Vue.extend({
  template: '#resource-panel-template',
  el: () => { return document.createElement('div'); },
  data: () => {return {down: true}; },
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
      this.down = !this.down;
    },
  },
  computed: {
    title: function (): string {
      return this.desc.name === '' ? this.desc.resourceType : `${this.desc.resourceType}(${this.desc.name})`;
    },

    class_up_down: function () {
      return {
        "glyphicon-chevron-down": this.down,
        "glyphicon-chevron-up":  !this.down,
      };
    },

    resourceTypes: function (): string[] {
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
