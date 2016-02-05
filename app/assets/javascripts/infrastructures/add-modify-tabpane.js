var jsonParseErr = require('./helper.js').jsonParseErr;

module.exports = Vue.extend({
  props: {
    templates: {
      type: Object,
      required: true,
    },
    result: {
      type: Object,
      required: true,
    },
  },

  data: function() {return {
    selected_cft_id: null,
  };},

  template: '#add-modify-tabpane-template',

  methods: {
    select_cft: function () {
      var self = this;
      var cft = _.find(self.templates.histories.concat(self.templates.globals), function (c) {
        return c.id === self.selected_cft_id;
      });
      self.result.name   = cft.name;
      self.result.detail = cft.detail;
      self.result.value  = cft.value;
    },

    submit: function () {
      if (this.jsonParseErr) {return;}
      this.$parent.show_tabpane('insert-cf-params');
      this.$parent.loading = true;
    },
  },

  computed: {
    jsonParseErr: function () { return jsonParseErr(this.result.value); },
  },
});
