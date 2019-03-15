var Infrastructure = require('models/infrastructure').default;
var S3Bucket       = require('models/s3_bucket').default;

var helpers = require('infrastructures/helper.js');
var alert_and_show_infra = helpers.alert_and_show_infra;

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

  data: function () {return {html: ""};},


  mounted: function () {
    this.$nextTick(function () {
      var self = this;
      var infra = new Infrastructure(self.infra_id);
      var s3 = new S3Bucket(infra, this.physical_id);
      s3.show().done(function (res) {
        self.html = res;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra(infra.id));
    })
  },
});
