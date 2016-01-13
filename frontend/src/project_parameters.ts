//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

import {Alert, AlertForAjaxStdError} from './modal';

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
        return t('project_parameters.label.removed');
      } else if (this.isNew) {
        return t('project_parameters.label.new');
      } else if (this.param.changed) {
        return t('project_parameters.label.edited');
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
    saving: false,
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

      this.saving = true;
      $.ajax({
        url: '/project_parameters',
        method: "PUT",
        data: {
          project_id: this.project.id,
          parameters: JSON.stringify(params),
        },
      }).fail(AlertForAjaxStdError(() => { location.reload(); }))
      .then((data) => {
        this.saving = false;
        return Alert(t('project_parameters.title'), data);
      }).then( () => {
        location.reload();
      });
    },
  },
});

console.log(ProjectParamApp);
