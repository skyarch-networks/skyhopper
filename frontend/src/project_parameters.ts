interface Parameter {
  id: number;
  key: string;
  value: string;
  project_id: number;
  remove: boolean;
  changed: boolean;
}

interface Project {
  id: number;
}

declare const PROJECT_PARAMETERS: Parameter[];
declare const PROJECT: Project;

PROJECT_PARAMETERS.forEach((p) => {
  p.remove  = false;
  p.changed = false;
});

Vue.component('param-tr', {
  template: '#param-tr-template',
  data: () => {return {}; },
  props: {
    param: {
      twoWay: true,
      required: true,
      type: Object,
    },
  },

  methods: {
    remove:   function () { this.param.remove = true; },
    unremove: function () { this.param.remove = false; },
  },

  computed: {
    isNew: function () { return this.param.id === null; },
    klass: function () {
      if (this.param.remove) {
        return ['danger'];
      } else if (this.isNew) {
        return ['success'];
      } else if (this.changed) {
        return ['info'];
      }
    },
  },

  watch: {
    param: function () {
      this.param.changed = true;
    },
  }
});

const ProjectParamApp = new Vue({
  el: '#project-parameter-index',
  data: {
    params: PROJECT_PARAMETERS,
    project: PROJECT,
  },
  methods: {
    add: function () {
      this.params.push({
        id: null,
        key: 'KEY',
        value: 'VALUE',
        project_id: this.project.id,
        remove: false,
      });
    },

    save: function () {
      // TODO
    },
  },
});

console.log(ProjectParamApp);
