var CFTemplate     = require('models/cf_template').default;
var Infrastructure = require('models/infrastructure').default;
var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var queryString = require('query-string').parse(location.search);

module.exports = Vue.extend({
  template: '#insert-cf-params-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    params: {},
    result: {},
    loading: false,
    key: '',
  };},
  methods: {
    submit: function () {
      this.loading = true;
      var infra = new Infrastructure(this.infra_id);
      var cft = new CFTemplate(infra);
      var self = this;
      cft.create_and_send(this.$parent.$data.current_infra.add_modify, this.result).done(alert_success(function () {
        require('infrastructures/show_infra').show_infra(infra.id);
      })).fail(alert_danger(function () {
        self.loading = false;
      }));
    },

    back: function () { this.$parent.show_tabpane('add_modify'); },
  },
  mounted: function () {
    this.$nextTick(function () {
      var self = this;
      console.log(self);

      var infra = new Infrastructure(this.infra_id);
      var cft = new CFTemplate(infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify)
        .fail(alert_danger(function () {
          self.back();
        })).then(function (data) {
        self.params = data;
        _.each(data, function (val, key) {
          Vue.set(self.result, key, val.Default);
        });
        self.$parent.loading = false;

        Vue.nextTick(function () {
          var inputs = $(self.$el).parent().find('input');
          var project_id = queryString.project_id;
          inputs.textcomplete([
            require('complete_project_parameter').default(project_id),
          ]);
        });
      });
    })
  },
});
