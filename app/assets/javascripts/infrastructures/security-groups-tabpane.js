var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;
var queryString = require('query-string').parse(location.search);

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#security-groups-tabpane-template',

  props: {
    ec2_instances: {
      type: Array,
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
    vpcs:           null,
    vpc:            null,
    group_name:     null,
    description:    null,
    name:           null,
    inbound: [],
    sec_group: null,
    ip: null,
    lang: queryString.lang,
    type: [],
    physical_id: null,
    loading_s: false,
  };},

  methods: {
    get_rules: function ()  {
      var self = this;
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, '');
      ec2.get_rules().done(function (data) {
        self.rules_summary = data.rules_summary;

        self.sec_group = data.sec_groups;
        var vpcs = [];
        _.forEach(data.vpcs, function (vpc) {
          var name = null;
            if(vpc.is_default) {
              if(vpc.tags[0]){
                name = vpc.vpc_id + " (" + vpc.cidr_block + ") | " + vpc.tags[0].value +" *";
              }else{
                name = vpc.vpc_id + " (" + vpc.cidr_block + ") *";
              }
            }else {
              if(vpc.tags[0])
                name = vpc.vpc_id + " (" + vpc.cidr_block + ") |" + vpc.tags[0].value;
              else
                name = vpc.vpc_id + " (" + vpc.cidr_block + ") |";
            }
          vpcs.push({vpc_id: vpc.vpc_id, name: name});
        });
        self.vpcs = vpcs;

        self.$parent.loading = false;
      });
    },

    add_rule: function (target) {
      var self = this;
      if(target === "inbound"){
        self.inbound.push(self.sec_group);
      }
      console.log(self.inbound);
    },

    show_ec2: function () {
      this.$parent.show_ec2(this.physical_id);
    },

    create_group: function () {
      if(!this.group_name && this.description && this.vpc && this.name) {return;}
      this.$parent.loading = true;
      var infra = new Infrastructure(this.infra_id);
      var ec2 = new EC2Instance(infra, '');
      ec2.create_group(
        [this.group_name,
        this.description,
        this.name,
        this.vpc]
      ).done(
        alert_success(this.get_rules())
      )
       .fail(alert_danger(this._show_ec2));
      this.group_name = null;
      this.description = null;
      this.name = null;
      this.vpc = null;
      this.$parent.loading = false;
    },
  },

  computed: {
    required_filed: function () {
      var self = this;
      return (self.group_name && self.description && self.name && self.vpc);
    },
  },

  mounted: function (){
    this.$nextTick(function () {
      console.log(this);
      this.get_rules();
      this.$parent.loading = false;
    })
  },

  filters: {
    trim: function (str) {
      var showChar = 50;
      return (str.length > showChar) ? str.substr(0, showChar)+"..." : str;
    },
  },

});
