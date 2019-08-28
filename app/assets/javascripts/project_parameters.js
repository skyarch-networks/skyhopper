/* global PROJECT, PROJECT_PARAMETERS */
const modal_1 = require('./modal');

PROJECT_PARAMETERS.forEach((p) => {
  p.remove = false;
  p.changed = false;
});
const editable_div = Vue.extend({
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
    'editable-div': editable_div,
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
    'param.key': function () { this.change(); },
    'param.value': function () { this.change(); },
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
      const _this = this;
      const params = this.params.filter(p => !p.remove);
      this.saving = true;
      $.ajax({
        url: '/project_parameters',
        method: 'PUT',
        data: {
          project_id: this.project.id,
          parameters: JSON.stringify(params),
        },
      }).fail(modal_1.AlertForAjaxStdError(() => { location.reload(); }))
        .then((data) => {
          _this.saving = false;
          return modal_1.Alert(t('project_parameters.title'), data);
        }).then(() => {
          location.reload();
        });
    },
  },
});
console.log(ProjectParamApp);
