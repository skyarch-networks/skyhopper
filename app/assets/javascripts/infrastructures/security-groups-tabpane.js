const Infrastructure = require('models/infrastructure').default;
const EC2Instance = require('models/ec2_instance').default;
const queryString = require('query-string').parse(location.search);

const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_danger = helpers.alert_danger;

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

  data() {
    return {
      loading: false,
      rules_summary: null,
      vpcs: null,
      vpc: null,
      group_name: null,
      description: null,
      name: null,
      table_data: [[]],
      inbound: [],
      sec_group: null,
      ip: null,
      lang: queryString.lang,
      type: [],
      physical_id: null,
      loading_s: false,
    };
  },

  methods: {
    get_rules() {
      const self = this;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      ec2.get_rules().done((data) => {
        self.rules_summary = data.rules_summary;
        const records = [];

        self.rules_summary.forEach((rule) => {
          const row_length = Math.max(rule.ip_permissions.length, rule.ip_permissions_egress.length, 1);
          for (let i = 0; i < row_length; i++) {
            const record = [];
            if (i === 0) {
              record.push({ text: rule.description, row: row_length, th: true });
              record.push({ text: rule.group_id, row: row_length, th: true });
            }
            if (rule.ip_permissions[i]) {
              record.push({ text: rule.ip_permissions[i].prefix_list_ids, row: 1 });
              record.push({ text: rule.ip_permissions[i].ip_protocol, row: 1 });
              record.push({ text: rule.ip_permissions[i].to_port, row: 1 });
              record.push({ text: rule.ip_permissions[i].ip_ranges.map(x => x.cidr_ip).join(', '), row: 1 });
            } else {
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
            }
            if (rule.ip_permissions_egress[i]) {
              record.push({ text: rule.ip_permissions_egress[i].prefix_list_ids, row: 1 });
              record.push({ text: rule.ip_permissions_egress[i].ip_protocol, row: 1 });
              record.push({ text: rule.ip_permissions_egress[i].to_port, row: 1 });
              record.push({ text: rule.ip_permissions_egress[i].ip_ranges[0].cidr_ip, row: 1 });
            } else {
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
              record.push({ text: '', row: 1 });
            }
            records.push(record);
          }
        });
        self.table_data = records;
        self.sec_group = data.sec_groups;
        const vpcs = [];
        _.forEach(data.vpcs, (vpc) => {
          let name = null;
          if (vpc.is_default) {
            if (vpc.tags[0]) {
              name = `${vpc.vpc_id} (${vpc.cidr_block}) | ${vpc.tags[0].value} *`;
            } else {
              name = `${vpc.vpc_id} (${vpc.cidr_block}) *`;
            }
          } else if (vpc.tags[0]) name = `${vpc.vpc_id} (${vpc.cidr_block}) |${vpc.tags[0].value}`;
          else name = `${vpc.vpc_id} (${vpc.cidr_block}) |`;
          vpcs.push({ vpc_id: vpc.vpc_id, name });
        });
        self.vpcs = vpcs;

        self.$parent.loading = false;
      });
    },

    add_rule(target) {
      const self = this;
      if (target === 'inbound') {
        self.inbound.push(self.sec_group);
      }
      console.log(self.inbound);
    },

    show_ec2() {
      this.$parent.show_ec2(this.physical_id);
    },

    create_group() {
      if (!this.group_name && this.description && this.vpc && this.name) { return; }
      this.$parent.loading = true;
      const infra = new Infrastructure(this.infra_id);
      const ec2 = new EC2Instance(infra, '');
      ec2.create_group(
        [this.group_name,
          this.description,
          this.name,
          this.vpc],
      ).done(
        alert_success(this.get_rules()),
      )
        .fail(alert_danger(this._show_ec2));
      this.group_name = null;
      this.description = null;
      this.name = null;
      this.vpc = null;
      this.$parent.loading = false;
    },
    check_length(args) {
      return args.length > 0;
    },
  },

  computed: {
    required_filed() {
      const self = this;
      return (self.group_name && self.description && self.name && self.vpc);
    },
  },

  mounted() {
    this.$nextTick(function () {
      this.get_rules();
      this.$parent.loading = false;
    });
  },

  filters: {
    trim(str) {
      const showChar = 50;
      return (str.length > showChar) ? `${str.substr(0, showChar)}...` : str;
    },
  },

});
