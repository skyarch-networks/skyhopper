var queryString    = require('query-string').parse(location.search);
var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

module.exports = Vue.extend({
  template: '#view-rules-tabpane-template',

  props: {
    physical_id: {
      type: String,
      required: true,
    },
    security_groups: {
      type: Array,
      required: true,
    },
    instance_type:{
      type: String,
      required: true,
    },
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () { return{
    loading:        false,
    rules_summary:  null,
    ip: null,
    lang: queryString.lang,
  };},

  methods: {
    get_rules: function ()  {
      var self = this;
      var group_ids = [];
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, this.physical_id);
      self.security_groups.forEach(function (value, key) {
        if(self.instance_type === 'elb'){
          if(value.checked)
            group_ids.push(value.group_id);
        }else{
          group_ids.push(value.group_id);
        }
      });

      ec2.get_rules(group_ids).done(function (data) {
        self.rules_summary = data.rules_summary;
      });
    },

    show_ec2: function () {
      if(this.instance_type === 'elb'){
        this.$parent.show_elb(this.physical_id);
      }else if (this.instance_type === 'rds') {
        this.$parent.show_rds(this.physical_id);
      }else{
        this.$parent.show_ec2(this.physical_id);
      }
    },
  },
  compiled: function() {
    console.log(this);
    this.get_rules();
    this.$parent.loading = false;
  },
});
