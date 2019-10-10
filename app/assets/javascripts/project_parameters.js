/* global PROJECT, PROJECT_PARAMETERS */
const modal1 = require('./modal');

PROJECT_PARAMETERS.forEach((p) => {
  p.remove = false;
  p.changed = false;
});
const editableDiv = Vue.extend({
  template: '<div contenteditable @blur="on_blur">{{text}}</div>',
  data() { return {}; },
  props: {
    text: {
      required: true,
      type: String,
    },
  },
  methods: {
    on_blur(e) { this.text = e.target.textContent; },
  },
});
Vue.component('param-tr', {
  template: '#param-tr-template',
  components: {
    'editable-div': editableDiv,
  },
  data() { return {}; },
  props: {
    param: {
      required: true,
      type: Object,
    },
  },
  methods: {
    remove() { this.param.remove = true; },
    unremove() { this.param.remove = false; },
    change() { this.param.changed = true; },
  },
  computed: {
    isNew() { return this.param.id === null; },
    klass() {
      if (this.param.remove) {
        return ['danger'];
      }
      if (this.isNew) {
        return ['success'];
      } if (this.param.changed) {
        return ['info'];
      }
      return null;
    },
    label_text() {
      if (this.param.remove) {
        return t('project_parameters.label.removed');
      }
      if (this.isNew) {
        return t('project_parameters.label.new');
      } if (this.param.changed) {
        return t('project_parameters.label.edited');
      }
      return null;
    },
  },
  watch: {
    'param.key': () => { this.change(); },
    'param.value': () => { this.change(); },
  },
});
new Vue({
  el: '#project-parameter-index',
  data: {
    params: PROJECT_PARAMETERS,
    project: PROJECT,
    saving: false,
  },
  methods: {
    add() {
      this.params.push({
        id: null,
        key: 'KEY',
        value: 'VALUE',
        project_id: this.project.id,
        remove: false,
      });
    },
    save() {
      const params = this.params.filter(p => !p.remove);
      this.saving = true;
      $.ajax({
        url: '/project_parameters',
        method: 'PUT',
        data: {
          project_id: this.project.id,
          parameters: JSON.stringify(params),
        },
      }).fail(modal1.AlertForAjaxStdError(() => { window.location.reload(); }))
        .then((data) => {
          this.saving = false;
          return modal1.Alert(t('project_parameters.title'), data);
        }).then(() => {
          window.location.reload();
        });
    },
  },
});
