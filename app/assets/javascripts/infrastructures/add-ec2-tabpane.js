var Infrastructure = require('models/infrastructure').default;
var Resource       = require('models/resource').default;
var EC2Instance    = require('models/ec2_instance').default;
var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_and_show_infra = helpers.alert_and_show_infra;

module.exports = Vue.extend({
  template: '#add-ec2-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    physical_id: '',
    screen_name: '',
    physical_ids: null,
  };},

  methods: {
    submit: function () {
      var infra = new Infrastructure(this.infra_id);
      var res = new Resource(infra);
      res.create(this.physical_id, this.screen_name)
        .done(alert_success(function () {
          var show_infra = require('./show_infra.js').show_infra;
          show_infra(infra.id);
        }))
        .fail(alert_and_show_infra);
    },
  },

  created: function () {
    console.log(this);
    var self = this;
    var infra = new Infrastructure(this.infra_id);
    var res = new EC2Instance(infra, "");
    res.available_resources().done(function (data){
      self.physical_ids = data;
    });

    $('#add_ec2_physical_id').selectize({
      delimiter: ',',
      persist: false,
      create: function(input) {
        return {
          value: input,
          text: input
        };
      }
    });
  },
});
