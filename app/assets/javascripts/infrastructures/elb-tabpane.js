const modal = require('modal');
const Infrastructure = require('models/infrastructure').default;
const EC2Instance = require('models/ec2_instance').default;
const queryString = require('query-string').parse(location.search);

const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_danger = helpers.alert_danger;
const alert_and_show_infra = helpers.alert_and_show_infra;
const toLocaleString = helpers.toLocaleString;

const methods = require('infrastructures/common-methods');

const has_selected = methods.has_selected;
const check_tag = methods.check_tag;

// this.physical_id is a elb_name.
module.exports = Vue.extend({
  template: '#elb-tabpane-template',

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

  data() {
    return {
      ec2_instances: [],
      unregistereds: [],
      lang: queryString.lang,
      dns_name: '',
      listeners: [],
      selected_ec2: null,
      server_certificates: [],
      server_certificate_name: '',
      server_certificate_name_items: [],
      loading: false,
      protocol: '',
      load_balancer_port: '',
      instance_protocol: '',
      instance_port: '',
      ssl_certificate_id: '',
      rules_summary: null,
      page: 0,
      dispItemSize: 10,
      filteredLength: null,
      filterKey: '',
      private_key: '',
      certificate_body: '',
      certificate_chain: '',
      loading_s: false,
      loading_groups: '',
    };
  },

  methods: {
    show_ec2(physical_id) { this.$parent.show_ec2(physical_id); },

    deregister(physical_id) {
      const self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.deregister'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, physical_id);
        const reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.deregister(self.physical_id)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    register() {
      const self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.register')).done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, self.selected_ec2);
        const reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.register(self.physical_id)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    state(s) { return s === 'InService' ? 'success' : 'danger'; },

    ssl_certificate_id_to_name(ssl_certificate_id) {
      if (!ssl_certificate_id) {
        return '';
      } if (ssl_certificate_id === 'Invalid-Certificate') {
        return 'Invalid-Certificate';
      }
      return ssl_certificate_id.replace(/arn:aws:iam::[0-9]+:server-certificate\//, '');
    },

    expiration_date(date_str) {
      if (!date_str) { return ''; }

      return toLocaleString(date_str);
    },

    set_create_listener_modal_default_value() {
      const self = this;
      self.protocol = '';
      self.load_balancer_port = '';
      self.instance_protocol = '';
      self.instance_port = '';
      self.ssl_certificate_id = '';
    },

    set_edit_listener_modal_default_value(protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id) {
      const self = this;
      self.old_load_balancer_port = load_balancer_port;
      self.protocol = protocol;
      self.load_balancer_port = load_balancer_port;
      self.instance_protocol = instance_protocol;
      self.instance_port = instance_port;
      if (ssl_certificate_id === 'Invalid-Certificate') {
        self.ssl_certificate_id = '';
      } else {
        self.ssl_certificate_id = ssl_certificate_id;
      }
    },

    change_listener_protocol() {
      const self = this;
      if (self.protocol !== 'HTTPS' && self.protocol !== 'SSL') {
        self.ssl_certificate_id = '';
      }
    },

    create_listener() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.create_listener(self.physical_id, self.protocol, self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done((msg) => {
          alert_success(reload)(msg);
          $('#create-listener-modal').modal('hide');
        })
        .fail((msg) => {
          alert_danger(reload)(msg);
          $('#create-listener-modal').modal('hide');
        });
    },

    update_listener() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.update_listener(self.physical_id, self.protocol, self.old_load_balancer_port, self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done((msg) => {
          alert_success(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        })
        .fail((msg) => {
          alert_danger(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        });
    },

    delete_listener(load_balancer_port) {
      const self = this;
      self.load_balancer_port = load_balancer_port;
      modal.Confirm(t('ec2_instances.btn.delete_to_elb_listener'), t('ec2_instances.confirm.delete_listener'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, '');
        const reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_listener(self.physical_id, self.load_balancer_port)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    upload_server_certificate() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.upload_server_certificate(self.physical_id, self.server_certificate_name, self.certificate_body, self.private_key, self.certificate_chain)
        .done((msg) => {
          alert_success(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        })
        .fail((msg) => {
          alert_danger(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        });
    },

    delete_server_certificate(server_certificate_name) {
      const self = this;
      self.server_certificate_name = server_certificate_name;
      modal.Confirm(t('ec2_instances.btn.delete_certificate'), t('ec2_instances.confirm.delete_certificate'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, '');
        const reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_server_certificate(self.physical_id, self.server_certificate_name)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    panel_class(state) { return `panel-${this.state(state)}`; },
    label_class(state) { return `label-${this.state(state)}`; },
    check(i) { i.checked = !i.checked; },
    reload() { this.$parent.show_elb(this.physical_id); },

    submit_groups() {
      const self = this;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const group_ids = this.rules_summary.filter(t => t.checked).map(t => t.group_id);
      const reload = function () {
        self.$parent.show_elb(self.physical_id);
      };

      ec2.elb_submit_groups(group_ids, self.physical_id)
        .done(alert_success(reload))
        .fail(alert_danger(reload));
    },
    view_rules() {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.rules_summary;
      this.$parent.instance_type = 'elb';
    },
    has_selected(arg) {
      if (arg) {
        return arg.some(c => c.checked);
      }
    },
    check_tag(r) {
      check_tag(r);
    },
    showPrev() {
      if (this.isStartPage) return;
      this.page--;
    },
    showNext() {
      if (this.isEndPage) return;
      this.page++;
    },
    roundup(val) { return (Math.ceil(val)); },
  },

  computed: {
    dispItems() {
      const startPage = this.page * this.dispItemSize;
      if (this.filterKey === '') {
        return this.rules_summary.slice(startPage, startPage + this.dispItemSize);
      }

      return this.rules_summary;
    },
    filterd_dispitems() {
      const self = this;
      const items = this.dispItems.filter((data) => {
        if (self.filterKey === '') {
          return true;
        }
        return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
      });
      self.filteredLength = items.length;
      return items;
    },
    isStartPage() { return (this.page === 0); },
    isEndPage() { return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length); },
  },

  mounted() {
    this.$nextTick(function () {
      const self = this;
      const infra = new Infrastructure(self.infra_id);
      infra.show_elb(this.physical_id).done((data) => {
        self.ec2_instances = data.ec2_instances;
        self.unregistereds = data.unregistereds;
        self.dns_name = data.dns_name;
        self.listeners = data.listeners;
        self.server_certificates = data.server_certificates;
        self.rules_summary = data.security_groups;
        self.server_certificate_name_items = data.server_certificate_name_items;

        self.$parent.loading = false;
        console.log(self);
      }).fail(alert_and_show_infra(infra.id));
    });
  },
  filters: {

    count(arr) {
      // record length
      this.$set('filteredLength', arr.length);
      // return it intact
      return arr;
    },
  },
});
