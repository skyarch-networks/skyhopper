const CFTemplate = require('models/cf_template').default;
const Infrastructure = require('models/infrastructure').default;
const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_danger = helpers.alert_danger;
const queryString = require('query-string').parse(location.search);

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
      cft.create_and_send(this.$parent.$data.current_infra.add_modify, this.result).done(alert_success(() => {
        require('infrastructures/show_infra').show_infra(infra.id);
      })).fail(alert_danger(() => {
        self.loading = false;
      }));
    },

    back() { this.$parent.show_tabpane('add_modify'); },
  },
  mounted() {
    this.$nextTick(function () {
      const self = this;
      console.log(self);

      const infra = new Infrastructure(this.infra_id);
      const cft = new CFTemplate(infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify)
        .fail(alert_danger(() => {
          self.back();
        })).then((data) => {
          self.params = data;
          _.each(data, (val, key) => {
            Vue.set(self.result, key, val.Default);
          });
          self.$parent.loading = false;

          Vue.nextTick(() => {
            const inputs = $(self.$el).parent().find('input');
            const project_id = queryString.project_id;
            inputs.textcomplete([
              require('complete_project_parameter').default(project_id),
            ]);
          });
        });
    });
  },
});
