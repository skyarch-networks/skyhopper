"use strict";
var modal_1 = require('./modal');
PROJECT_PARAMETERS.forEach(function (p) {
    p.remove = false;
    p.changed = false;
});
var editable_div = Vue.extend({
    template: '<div contenteditable @blur="on_blur">{{text}}</div>',
    data: function () { return {}; },
    props: {
        text: {
            required: true,
            type: String,
        },
    },
    methods: {
        on_blur: function (e) { this.text = e.target.textContent; },
    },
});
Vue.component('param-tr', {
    template: '#param-tr-template',
    components: {
        'editable-div': editable_div,
    },
    data: function () { return {}; },
    props: {
        param: {
            required: true,
            type: Object,
        },
    },
    methods: {
        remove: function () { this.param.remove = true; },
        unremove: function () { this.param.remove = false; },
        change: function () { this.param.changed = true; },
    },
    computed: {
        isNew: function () { return this.param.id === null; },
        klass: function () {
            if (this.param.remove) {
                return ['danger'];
            }
            else if (this.isNew) {
                return ['success'];
            }
            else if (this.param.changed) {
                return ['info'];
            }
            return null;
        },
        label_text: function () {
            if (this.param.remove) {
                return t('project_parameters.label.removed');
            }
            else if (this.isNew) {
                return t('project_parameters.label.new');
            }
            else if (this.param.changed) {
                return t('project_parameters.label.edited');
            }
            return null;
        },
    },
    watch: {
        "param.key": function () { this.change(); },
        "param.value": function () { this.change(); },
    },
});
var ProjectParamApp = new Vue({
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
            var _this = this;
            var params = this.params.filter(function (p) { return !p.remove; });
            this.saving = true;
            $.ajax({
                url: '/project_parameters',
                method: "PUT",
                data: {
                    project_id: this.project.id,
                    parameters: JSON.stringify(params),
                },
            }).fail(modal_1.AlertForAjaxStdError(function () { location.reload(); }))
                .then(function (data) {
                _this.saving = false;
                return modal_1.Alert(t('project_parameters.title'), data);
            }).then(function () {
                location.reload();
            });
        },
    },
});
console.log(ProjectParamApp);
