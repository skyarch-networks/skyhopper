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

const editable_div = Vue.extend({
  template: '<div contenteditable @blur="on_blur">{{text}}</div>',
  data: () => {return {}; },
  props: {
    text: {
      twoWay: true,
      required: true,
      type: String,
    },
  },

  methods: {
    on_blur: function (e: any) { this.text = e.target.textContent; },
  },
});

Vue.component('param-tr', {
  template: '#param-tr-template',
  components: {
    'editable-div': editable_div,
  },
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
    change:   function () { this.param.changed = true; },
  },

  computed: {
    isNew: function () { return this.param.id === null; },

    klass: function () {
      if (this.param.remove) {
        return ['danger'];
      } else if (this.isNew) {
        return ['success'];
      } else if (this.param.changed) {
        return ['info'];
      }
      return null;
    },

    label_text: function () {
      if (this.param.remove) {
        return 'Removed';
      } else if (this.isNew) {
        return 'New';
      } else if (this.param.changed) {
        return 'Edited';
      }
      return null;
    },
  },

  watch: {
    "param.key":   function () { this.change(); },
    "param.value": function () { this.change(); },
  },
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
      const params = (<Parameter[]>this.params).filter(p => !p.remove);

      $.ajax({
        url: '/project_parameters',
        method: "PUT",
        data: {
          project_id: this.project.id,
          params: JSON.stringify(params),
        },
      });
    },
  },
});

console.log(ProjectParamApp);
