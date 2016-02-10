var modal          = require('modal');
var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;
var alert_and_show_infra = helpers.alert_and_show_infra;
var toLocaleString       = helpers.toLocaleString;

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

  data: function () {return {
    ec2_instances: [],
    unregistereds: [],
    dns_name: "",
    listeners: [],
    selected_ec2: null,
    server_certificates: [],
    server_certificate_name_items: [],
    loading: false,
    protocol: '',
    load_balancer_port: '',
    instance_protocol: '',
    instance_port: '',
    ssl_certificate_id: '',
    security_groups: null,
  };},

  methods: {
    show_ec2: function (physical_id) { this.$parent.show_ec2(physical_id); },

    deregister: function (physical_id) {
      var self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.deregister'), 'danger').done(function () {
        var infra = new Infrastructure(self.infra_id);
        var ec2 = new EC2Instance(infra, physical_id);
        var reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.deregister(self.physical_id)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    register: function () {
      var self = this;
      modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.register')).done(function () {
        var infra = new Infrastructure(self.infra_id);
        var ec2 = new EC2Instance(infra, self.selected_ec2);
        var reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.register(self.physical_id)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    state: function (s){ return s === 'InService' ? 'success' : 'danger'; },

    ssl_certificate_id_to_name: function (ssl_certificate_id) {
      if (!ssl_certificate_id) {
        return "";
      } else if (ssl_certificate_id === "Invalid-Certificate"){
        return "Invalid-Certificate";
      }
      return ssl_certificate_id.replace(/arn:aws:iam::[0-9]+:server-certificate\//, "");
    },

    expiration_date: function (date_str) {
      if (!date_str) { return ""; }

      return toLocaleString(date_str);
    },

    set_create_listener_modal_default_value: function (){
      var self = this;
      self.protocol = "";
      self.load_balancer_port = "";
      self.instance_protocol = "";
      self.instance_port = "";
      self.ssl_certificate_id = "";
    },

    set_edit_listener_modal_default_value: function (protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id){
      var self = this;
      self.old_load_balancer_port = load_balancer_port;
      self.protocol = protocol;
      self.load_balancer_port = load_balancer_port;
      self.instance_protocol = instance_protocol;
      self.instance_port = instance_port;
      if (ssl_certificate_id === "Invalid-Certificate"){
        self.ssl_certificate_id = "";
      } else {
        self.ssl_certificate_id = ssl_certificate_id;
      }
    },

    change_listener_protocol: function(){
      var self = this;
      if (self.protocol !== "HTTPS" && self.protocol !== "SSL") {
        self.ssl_certificate_id = "";
      }
    },

    create_listener: function(){
      var self = this;
      self.loading = true;
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, "");
      var reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.create_listener(self.physical_id, self.protocol, self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done(function (msg) {
          alert_success(reload)(msg);
          $('#create-listener-modal').modal('hide');
        })
        .fail(function (msg) {
          alert_danger(reload)(msg);
          $('#create-listener-modal').modal('hide');
        });
    },

    update_listener: function(){
      var self = this;
      self.loading = true;
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, "");
      var reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.update_listener(self.physical_id, self.protocol, self.old_load_balancer_port, self.load_balancer_port, self.instance_protocol, self.instance_port, self.ssl_certificate_id)
        .done(function (msg) {
          alert_success(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        })
        .fail(function (msg) {
          alert_danger(reload)(msg);
          $('#edit-listener-modal').modal('hide');
        });
    },

    delete_listener: function(load_balancer_port){
      var self = this;
      self.load_balancer_port = load_balancer_port;
      modal.Confirm(t('ec2_instances.btn.delete_to_elb_listener'), t('ec2_instances.confirm.delete_listener'), 'danger').done(function () {
        var infra = new Infrastructure(self.infra_id);
        var ec2 = new EC2Instance(infra, "");
        var reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_listener(self.physical_id, self.load_balancer_port)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    upload_server_certificate: function(){
      var self = this;
      self.loading = true;
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, "");
      var reload = function () {
        self.$parent.show_elb(self.physical_id);
      };
      ec2.upload_server_certificate(self.physical_id, self.server_certificate_name, self.certificate_body, self.private_key, self.certificate_chain)
        .done(function (msg) {
          alert_success(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        })
        .fail(function (msg) {
          alert_danger(reload)(msg);
          $('#upload-server-certificate-modal').modal('hide');
        });
    },

    delete_server_certificate: function(server_certificate_name){
      var self = this;
      self.server_certificate_name = server_certificate_name;
      modal.Confirm(t('ec2_instances.btn.delete_certificate'), t('ec2_instances.confirm.delete_certificate'), 'danger').done(function () {
        var infra = new Infrastructure(self.infra_id);
        var ec2 = new EC2Instance(infra, "");
        var reload = function () {
          self.$parent.show_elb(self.physical_id);
        };
        ec2.delete_server_certificate(self.physical_id, self.server_certificate_name)
          .done(alert_success(reload))
          .fail(alert_danger(reload));
      });
    },

    panel_class: function (state) { return 'panel-' + this.state(state);},
    label_class: function (state) { return 'label-' + this.state(state);},
    check:       function (i) { i.checked= !i.checked; },
    reload:      function(){ this.$parent.show_elb(this.physical_id); },

    elb_submit_groups: function(){
      var self = this;
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, '');
      var group_ids = this.security_groups.filter(function (t) {
        return t.checked;
      }).map(function (t) {
        return t.group_id;
      });
      var reload = function () {
        self.$parent.show_elb(self.physical_id);
      };

      ec2.elb_submit_groups(group_ids, self.physical_id)
        .done(alert_success(reload))
        .fail(alert_danger(reload));

    },

    view_rules: function () {
      this.$parent.tabpaneID = 'view-rules';
      this.$parent.sec_group = this.security_groups;
      this.$parent.instance_type = 'elb';
    }
  },

  computed: {
    has_selected: function() {
      return this.security_groups.some(function(c){
        return c.checked;
      });
    },
  },

  compiled: function () {
    var self = this;
    var infra = new Infrastructure(self.infra_id);
    infra.show_elb(this.physical_id).done(function (data) {
      self.ec2_instances = data.ec2_instances;
      self.unregistereds = data.unregistereds;
      self.dns_name = data.dns_name;
      self.listeners = data.listeners;
      self.server_certificates = data.server_certificates;
      self.security_groups = data.security_groups;
      self.server_certificate_name_items = data.server_certificate_name_items;

      self.$parent.loading = false;
      console.log(self);
    }).fail(alert_and_show_infra);
  },
});


