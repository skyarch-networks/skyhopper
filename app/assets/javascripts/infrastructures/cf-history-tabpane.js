const Infrastructure = require('../models/infrastructure').default;
const CFTemplate = require('../models/cf_template').default;

const helpers = require('../infrastructures/helper.js');

const { toLocaleString } = helpers;
const alertAndShowInfra = helpers.alert_and_show_infra;

module.exports = Vue.extend({
  template: '#cf-history-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      id: -1,
      current: null,
      history: [],
    };
  },

  methods: {
    active(id) { return this.id === id; },
    toLocaleString,

    get(id) {
      const self = this;
      self.id = id;

      const infra = new Infrastructure(this.infra_id);
      const cft = new CFTemplate(infra);
      cft.show(id).done((data) => {
        self.current = data;
      }).fail(alertAndShowInfra(infra.id));
    },
  },
  computed: {
    currentExists() { return !!this.current; },
  },
  created() {
    const self = this;
    const infra = new Infrastructure(this.infra_id);
    const cft = new CFTemplate(infra);
    cft.history().done((data) => {
      self.history = data;
      self.$parent.loading = false;
    }).fail(alertAndShowInfra(infra.id));
  },
});
