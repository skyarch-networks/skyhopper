//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function (stack, Resource, EC2Instance, current_infra, CFTemplate, alert_danger, stack_in_progress, current_tab) {
  return new Vue({
    template: '#infra-show-template',
    data: {
      current_infra: {
        id: parseInt(current_infra.id),
        stack: stack,
        resources : {},
        events: [],
        templates: {histories: null, globals: null},
        add_modify: {name: "", detail: "", value: ""},
      },
      tabpaneID: 'default',     // tabpane 一つ一つのID. これに対応する tab の中身が表示される
      tabpaneGroupID: null,     // 複数の tabpane をまとめるID. これに対応する tab が表示される
      spec_Columns: ['serverspec', 'resource', 'message', 'status', 'created_at'],
      sec_group: null,
      instance_type: null,
      ops_sched_Columns: ['physical_id', 'screen_name', 'id'],
      serverspec_failed: t('infrastructures.serverspec_failed'),
      loading: true,  // trueにすると、loading-tabpaneが表示される。
    },
    methods:{
      screen_name: function (res) {
        if (res.screen_name) {
          return res.screen_name + ' / ' + res.physical_id;
        } else {
          return res.physical_id;
        }
      },
      show_ec2: function (physical_id) {
        this.show_tabpane('ec2');
        this.loading = true;
        this.tabpaneGroupID = physical_id;
      },
      show_rds: function (physical_id) {
        this.show_tabpane('rds');
        this.tabpaneGroupID = physical_id;
        this.loading = true;
      },
      show_elb: function (physical_id) {
        this.show_tabpane('elb');
        this.tabpaneGroupID = physical_id;
        this.loading = true;
      },
      show_s3: function (physical_id) {
        this.show_tabpane('s3');
        this.tabpaneGroupID = physical_id;
        this.loading = true;
      },
      show_add_modify: function () {
        var self = this;
        self.loading = true;
        self.$event.preventDefault();

        var cft = new CFTemplate(current_infra);
        cft.new().done(function (data) {
          self.current_infra.templates.histories = data.histories;
          self.current_infra.templates.globals = data.globals;

          self.show_tabpane('add_modify');
        }).fail(alert_danger());
      },

      show_add_ec2: function () { this.show_tabpane('add-ec2'); },

      show_cf_history: function () {
        var self = this;
        self.$event.preventDefault();
        self.show_tabpane('cf_history');
        self.loading = true;
      },
      show_event_logs: function () {
        if (this.no_stack) {return;}
        var self = this;
        self.loading = true;
        self.$event.preventDefault();

        current_infra.stack_events().done(function (res) {
          self.current_infra.events = res.stack_events;
          self.show_tabpane('event_logs');
        });
      },
      show_infra_logs: function () {
        var self = this;
        self.$event.preventDefault();
        self.show_tabpane('infra_logs');
        self.loading = true;
      },
      show_sec_groups: function () {
        var self = this;
        self.$event.preventDefault();
        self.show_tabpane('security_groups');
        self.loading = true;
      },
      show_monitoring: function () {
        if (this.no_stack) {return;}
        var self = this;
        self.show_tabpane('monitoring');
        self.loading = true;
      },
      show_edit_monitoring: function () {
        if (this.no_stack) {return;}
        var self = this;
        self.show_tabpane('edit-monitoring');
        self.loading = true;
      },
      show_update_template: function () {
        if (this.no_stack) {return;}
        var self = this;
        self.show_tabpane('update-template');
        self.loading = true;
      },
      show_operation_sched: function () {
        if (this.no_stack) {return;}
        var self = this;
        self.show_tabpane('operation-sched');
        self.loading = true;
      },


      tabpane_active: function (id) { return this.tabpaneID === id; },

      show_tabpane: function (id) {
        var self = this;
        self.loading = false;
        self.tabpaneGroupID = null;
        // 一旦 tabpane を null にすることで、同じ tabpane をリロードできるようにする。
        self.tabpaneID = null;
        Vue.nextTick(function () {
          self.tabpaneID = id;
        });
      },
      update_serverspec_status: function (physical_id) {
        var ec2 = new EC2Instance(current_infra, physical_id);
        var self = this;
        ec2.serverspec_status().done(function (data) {
          var r = _.find(self.current_infra.resources.ec2_instances, function (v) {
            return v.physical_id === physical_id;
          });
          r.serverspec_status = data;
        });
      },
    },
    filters: {
      toLocaleString: toLocaleString,
    },
    computed: {
      no_stack:    function () { return this.current_infra.stack.status.type === 'NONE'; },
      in_progress: function () { return this.current_infra.stack.status.type === 'IN_PROGRESS'; },
      stack_fail:  function () { return this.current_infra.stack.status.type === 'NG'; },

      status_label_class: function () {
        var resp = "label-";
        var type = this.current_infra.stack.status.type;
        if (type === "OK") {
          resp += 'success';
        } else if (type === "NG") {
          resp += "danger";
        } else {
          resp += "default";
        }
        return resp;
      },
    },
    ready: function () {
      var self = this;
      console.log(self);
      if (stack.status.type === 'OK') {


        var res = new Resource(current_infra);
        res.index().done(function (resources) {
          _.forEach(resources.ec2_instances, function (v) {
            v.serverspec_status = true;
          });
          self.current_infra.resources = resources;
          // show first tab
          var instance = _(resources).values().flatten().first();
          var physical_id = instance.physical_id;
          if(current_tab === 'show_sched'){
            self.show_operation_sched();
          } else if (instance.type_name === "AWS::EC2::Instance") {
            self.show_ec2(physical_id);
          } else if (instance.type_name === "AWS::RDS::DBInstance"){
            self.show_rds(physical_id);
          } else if (instance.type_name === "AWS::ElasticLoadBalancing::LoadBalancer") {
            self.show_elb(physical_id);
          } else {  // S3
            self.show_s3(physical_id);
          }

          _.forEach(self.current_infra.resources.ec2_instances, function (v) {
            self.update_serverspec_status(v.physical_id);
          });
        });
      }
      else if (stack.status.type === 'IN_PROGRESS') {
        stack_in_progress(current_infra);
        self.$data.loading = false;
      }
      else if (stack.status.type === 'NG') {
        current_infra.stack_events().done(function (res) {
          self.$data.current_infra.events = res.stack_events;
          self.$data.loading = false;
        });
      } else if (stack.status.type === "NONE") {
        // no stack info
        self.$data.loading = false;
      }
    },
  });
};
