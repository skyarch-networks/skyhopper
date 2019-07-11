const queryString = require('query-string').parse(window.location.search);
const CFTemplate = require('../models/cf_template').default;
const Infrastructure = require('../models/infrastructure').default;
const helpers = require('../infrastructures/helper.js');
const showInfra = require('../infrastructures/show_infra');
const completeProjectParameter = require('../complete_project_parameter');

const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#insert-cf-params-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      params: {},
      result: {},
      loading: false,
      key: '',
    };
  },
  methods: {
    submit() {
      this.loading = true;
      const infra = new Infrastructure(this.infra_id);
      const cft = new CFTemplate(infra);
      const self = this;
      cft.create_and_send(this.$parent.$data.current_infra.add_modify, this.result).done(alertSuccess(() => {
        showInfra.show_infra(infra.id);
      })).fail(alertDanger(() => {
        self.loading = false;
      }));
    },

    back() { this.$parent.show_tabpane('add_modify'); },
  },
  mounted() {
    this.$nextTick(() => {
      const self = this;
      // console.log(self);

      const infra = new Infrastructure(this.infra_id);
      const cft = new CFTemplate(infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify)
        .fail(alertDanger(() => {
          self.back();
        })).then((data) => {
          self.params = data;

          Object.entries(data).forEach(([key, val]) => {
            Vue.set(self.result, key, val.Default);
          });
          self.$parent.loading = false;

          Vue.nextTick(() => {
            const inputs = $(self.$el).parent().find('input');
            const projectId = queryString.project_id;
            inputs.textcomplete([
              completeProjectParameter.default(projectId),
            ]);
          });
        });
    });
  },
});
