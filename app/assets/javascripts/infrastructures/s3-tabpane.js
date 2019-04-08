const Infrastructure = require('models/infrastructure').default;
const S3Bucket = require('models/s3_bucket').default;

const helpers = require('infrastructures/helper.js');

const alert_and_show_infra = helpers.alert_and_show_infra;

module.exports = Vue.extend({
  template: '#s3-tabpane-template',

  props: {
    physical_id: {
      type: String,
      required: true,
    },
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() { return { html: '' }; },


  mounted() {
    this.$nextTick(function () {
      const self = this;
      const infra = new Infrastructure(self.infra_id);
      const s3 = new S3Bucket(infra, this.physical_id);
      s3.show().done((res) => {
        self.html = res;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra(infra.id));
    });
  },
});
