const Infrastructure = require('../models/infrastructure').default;
const Resource = require('../models/resource').default;
const EC2Instance = require('../models/ec2_instance').default;
const helpers = require('../infrastructures/helper.js');
const ShowInfra = require('../infrastructures/show_infra').default;

const alertSuccess = helpers.alert_success;
const alertAndShowInfra = helpers.alert_and_show_infra;

module.exports = Vue.extend({
  template: '#add-ec2-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      physical_id: '',
      screen_name: '',
      physical_ids: null,
      loading: '',
    };
  },

  methods: {
    submit() {
      const infra = new Infrastructure(this.infra_id);
      const res = new Resource(infra);
      res.create(this.physical_id, this.screen_name)
        .done(alertSuccess(() => {
          ShowInfra.show_infra(infra.id);
        }))
        .fail(alertAndShowInfra(infra.id));
    },
  },

  created() {
    const self = this;
    const infra = new Infrastructure(this.infra_id);
    const res = new EC2Instance(infra, '');
    res.available_resources().done((data) => {
      self.physical_ids = data;
    });
  },
});
