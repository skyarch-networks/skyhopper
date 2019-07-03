const queryString = require('query-string').parse(window.location.search);
const modal = require('../modal');
const Infrastructure = require('../models/infrastructure').default;
const EC2Instance = require('../models/ec2_instance').default;

const helpers = require('../infrastructures/helper.js');

const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;
const alertAndShowInfra = helpers.alert_and_show_infra;
const { toLocaleString } = helpers;

const methods = require('../infrastructures/common-methods');

const hasSelected = methods.has_selected;
const checkTag = methods.check_tag;

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
    show_ec2(physicalId) { this.$parent.show_ec2(physicalId); },

    deregister(physicalId) {
      const self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.deregister'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, physicalId);
        const reload = () => {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.deregister(self.physical_id)
          .done(alertSuccess(reload))
          .fail(alertDanger(reload));
      });
    },

    register() {
      const self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.register')).done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, self.selected_ec2);
        const reload = () => {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.register(self.physical_id)
          .done(alertSuccess(reload))
          .fail(alertDanger(reload));
      });
    },

    state(s) { return s === 'InService' ? 'success' : 'danger'; },

    ssl_certificate_id_to_name(sslCertificateId) {
      if (!sslCertificateId) {
        return '';
      } if (sslCertificateId === 'Invalid-Certificate') {
        return 'Invalid-Certificate';
      }
      return sslCertificateId.replace(/arn:aws:iam::[0-9]+:server-certificate\//, '');
    },

    expiration_date(dateStr) {
      if (!dateStr) { return ''; }

      return toLocaleString(dateStr);
    },

    set_create_listener_modal_default_value() {
      const self = this;
      self.protocol = '';
      self.load_balancer_port = '';
      self.instance_protocol = '';
      self.instance_port = '';
      self.ssl_certificate_id = '';
    },

    set_edit_listener_modal_default_value(protocol, loadBalancerPort, instanceProtocol, instancePort, sslCertificateId) {
      const self = this;
      self.old_load_balancer_port = loadBalancerPort;
      self.protocol = protocol;
      self.load_balancer_port = loadBalancerPort;
      self.instance_protocol = instanceProtocol;
      self.instance_port = instancePort;
      if (sslCertificateId === 'Invalid-Certificate') {
        self.ssl_certificate_id = '';
      } else {
        self.ssl_certificate_id = sslCertificateId;
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
      const reload = () => {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.create_listener(self.physical_id, self.protocol, self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done((msg) => {
          alertSuccess(reload)(msg);
          $('#create-listener-modal').modal('hide');
        })
        .fail((msg) => {
          alertDanger(reload)(msg);
          $('#create-listener-modal').modal('hide');
        });
    },

    update_listener() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const reload = () => {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.update_listener(self.physical_id, self.protocol, self.old_load_balancer_port,
        self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done((msg) => {
          alertSuccess(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        })
        .fail((msg) => {
          alertDanger(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        });
    },

    delete_listener(loadBalancerPort) {
      const self = this;
      self.load_balancer_port = loadBalancerPort;
      modal.Confirm(t('ec2_instances.btn.delete_to_elb_listener'), t('ec2_instances.confirm.delete_listener'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, '');
        const reload = () => {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_listener(self.physical_id, self.load_balancer_port)
          .done(alertSuccess(reload))
          .fail(alertDanger(reload));
      });
    },

    upload_server_certificate() {
      const self = this;
      self.loading = true;
      const infra = new Infrastructure(self.infra_id);
      const ec2 = new EC2Instance(infra, '');
      const reload = () => {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.upload_server_certificate(self.physical_id, self.server_certificate_name, self.certificate_body, self.private_key, self.certificate_chain)
        .done((msg) => {
          alertSuccess(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        })
        .fail((msg) => {
          alertDanger(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        });
    },

    delete_server_certificate(serverCertificateName) {
      const self = this;
      self.server_certificate_name = serverCertificateName;
      modal.Confirm(t('ec2_instances.btn.delete_certificate'), t('ec2_instances.confirm.delete_certificate'), 'danger').done(() => {
        const infra = new Infrastructure(self.infra_id);
        const ec2 = new EC2Instance(infra, '');
        const reload = () => {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_server_certificate(self.physical_id, self.server_certificate_name)
          .done(alertSuccess(reload))
          .fail(alertDanger(reload));
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
      const groupIds = this.rules_summary.filter(t => t.checked).map(t => t.group_id);
      const reload = () => {
        self.$parent.show_elb(self.physical_id);
      };

      ec2.elb_submit_groups(groupIds, self.physical_id)
        .done(alertSuccess(reload))
        .fail(alertDanger(reload));
    },
    view_rules() {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.rules_summary;
      this.$parent.instance_type = 'elb';
    },
    has_selected(arg) {
      return hasSelected(arg);
    },
    check_tag(r) {
      checkTag(r);
    },
    showPrev() {
      if (this.isStartPage) return;
      this.page -= 1;
    },
    showNext() {
      if (this.isEndPage) return;
      this.page += 1;
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
    this.$nextTick(function ready() {
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
      }).fail(alertAndShowInfra(infra.id));
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
