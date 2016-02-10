var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;

var queryString = require('query-string').parse(location.search);

module.exports = Vue.extend({
  template: '#edit-attr-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    attributes: null,
    loading:    false,
  };},

  methods: {
    update: function () {
      var self = this;
      self.loading = true;
      self.ec2.update_attributes(self.attributes)
        .done(alert_success(self.show_ec2))
        .fail(alert_danger(self.show_ec2));
    },

    use_default: function (attr) { attr.value = attr.default; },
    show_ec2:    function ()     { this.$parent.show_ec2(this.physical_id); },
  },

  filters: {
    toID: function (name) { return name.replace(/\//g, '-'); },
  },

  computed: {
    physical_id: function () { return this.$parent.tabpaneGroupID; },
    ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    empty:       function () { return _.isEmpty(this.attributes); },
  },

  created: function () {
    var self = this;
    self.ec2.edit_attributes().done(function (data) {
      self.attributes = data;
      self.$parent.loading = false;
      Vue.nextTick(function () {
        var inputs = $(self.$el).parent().find('input');
        var project_id = queryString.project_id;
        inputs.textcomplete([
          require('complete_project_parameter').default(project_id),
        ]);
      });
    }).fail(alert_danger(self.show_ec2));
  },
});
