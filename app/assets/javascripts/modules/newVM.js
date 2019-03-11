//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

var Infrastructure = require('models/infrastructure').default;
var CFTemplate   = require('models/cf_template').default;
var Resource     = require('models/resource').default;
var EC2Instance  = require('models/ec2_instance').default;
var helpers      = require('infrastructures/helper.js');
var alert_danger = helpers.alert_danger;
var reload_infra_index_page = require('infrastructures/show_infra').reload_infra_index_page;

module.exports = function () {
  function data () {
    return {
      infra_model: null, // これが別のオブジェクトを指したら、表示系の非同期処理は取り消される
      current_infra: {
        id: null,
        stack: {
          status: {
            type: null,
          },
        },
        resources: {},
        events: [],
        templates: {histories: null, globals: null},
        add_modify: {name: "", detail: "", format: "JSON", value: ""},
      },
      tabpaneID: 'default',     // tabpane 一つ一つのID. これに対応する tab の中身が表示される
      tabpaneGroupID: null,     // 複数の tabpane をまとめるID. これに対応する tab が表示される
      spec_Columns: ['serverspec', 'resource', 'message', 'status', 'created_at'],
      sec_group: null,
      instance_type: null,
      ops_sched_Columns: ['physical_id', 'screen_name', 'id'],
      serverspec_failed: t('infrastructures.serverspec_failed'),
      loading: true,  // trueにすると、loading-tabpaneが表示される。
      infra_loading: true,
    };
  };
  return {
    template: '#infra-show-template',
    props: {
      initial_tab: String,
    },
    data: data,
    methods:{
      screen_name: function (res) {
        if (res.screen_name) {
          return res.screen_name + ' / ' + this.subsStr(res.physical_id);
        } else {
          return this.subsStr(res.physical_id);
        }
      },
      subsStr: function(string) {
        if(string.length > 10){
          return string.substring(0, string.length/2)+"...";
        }else {
          return string;
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
      show_no_resource: function () {
        this.loading = false;
      },
      show_add_modify: function () {
        var self = this;
        self.loading = true;
        //self.$event.preventDefault();

        var cft = new CFTemplate(self.infra_model);
        cft.new().done(self.wrapping_into_same_model_check(function (data) {
          self.current_infra.templates.histories = data.histories;
          self.current_infra.templates.globals = data.globals;

          self.show_tabpane('add_modify');
        })).fail(self.wrapping_into_same_model_check(alert_danger()));
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

        self.infra_model.stack_events().done(self.wrapping_into_same_model_check(function (res) {
          self.current_infra.events = res.stack_events;
          self.show_tabpane('event_logs');
        }));
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
      show_operation_sched: function (resources) {
        if (this.no_stack) {return;}
        var self = this;
        self.show_tabpane('operation-sched');
        self.resources = resources;
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
        var self = this;
        var ec2 = new EC2Instance(self.infra_model, physical_id);
        ec2.serverspec_status().done(self.wrapping_into_same_model_check(function (data) {
          var r = _.find(self.current_infra.resources.ec2_instances, function (v) {
            return v.physical_id === physical_id;
          });
          r.serverspec_status = data;
        }));
      },

      stack_in_progress: function () {
        var self = this;
        self.infra_model.stack_events().done(self.wrapping_into_same_model_check(function (res) {
          self.$data.current_infra.events = res.stack_events;

          if (res.stack_status.type === 'IN_PROGRESS') {
            setTimeout(function () {
              self.stack_in_progress();
            }, 15000);
          } else {
            self.reset();
          }
        }));
      },
      is_progress: function () {
        return (this.current_infra.stack.status.type === 'IN_PROGRESS');
      },
      back_to_top: function(){
        var offset = 250;
        var duration = 300;

        $(window).scroll(function() {
          if ($(this).scrollTop() > offset) {
            $('.back-to-top').fadeIn(duration);
          } else {
            $('.back-to-top').fadeOut(duration);
          }
        });

        $('.back-to-top').click(function(event) {
          event.preventDefault();
          $('html, body').animate({scrollTop: 0}, duration);
          return false;
        });
      },
      reset: function (open_tab) {
        var self = this;
        var infra_id = this.$route.params.infra_id;
        self.$parent.data = data();
        self.current_infra.id = parseInt(infra_id);
        self.infra_loading = true;
        self.infra_model = new Infrastructure(infra_id);
        self.infra_model.show().done(
          self.wrapping_into_same_model_check(function (stack) {
            self.infra_loading = false;
            self.current_infra.stack = stack;
            self.init_infra(open_tab);
          })
        ).fail(function (msg) {
          self.wrapping_into_same_model_check(alert_danger(reload_infra_index_page)(msg));
        });
      },
      wrapping_into_same_model_check: function(callback) {
        var self = this;
        return (function (my_model) {
          return function (arg1) {
            if (my_model !== self.infra_model){
              return;
            }
            callback(arg1);
          };
        }(self.infra_model))
      },
      init_infra: function (current_tab) {
        var self = this;
        console.log(self);
        self.back_to_top();

        if (self.current_infra.stack.status.type === 'OK') {
          var res = new Resource(self.infra_model);
          res.index().done(self.wrapping_into_same_model_check(function (resources) {
            _.forEach(resources.ec2_instances, function (v) {
              v.serverspec_status = true;
            });
            self.current_infra.resources = resources;
            // show first tab
            if(current_tab === 'show_sched'){
              self.show_operation_sched(resources);
            } else {
              var instance = _(resources).values().flatten().first();
              if (instance) {
                var physical_id = instance.physical_id;
                if (instance.type_name === "AWS::EC2::Instance") {
                  self.show_ec2(physical_id);
                } else if (instance.type_name === "AWS::RDS::DBInstance"){
                  self.show_rds(physical_id);
                } else if (instance.type_name === "AWS::ElasticLoadBalancing::LoadBalancer") {
                  self.show_elb(physical_id);
                } else { // S3
                  self.show_s3(physical_id);
                }
              } else {
                self.show_no_resource();
              }
            }

            _.forEach(self.current_infra.resources.ec2_instances, function (v) {
              self.update_serverspec_status(v.physical_id);
            });
          }));
        } else if (self.current_infra.stack.status.type === 'IN_PROGRESS') {
          self.stack_in_progress();
          self.$data.loading = false;

        } else if (self.current_infra.stack.status.type === 'NG') {
          self.infra_model.stack_events().done(self.wrapping_into_same_model_check(function (res) {
            self.$data.current_infra.events = res.stack_events;
            self.$data.loading = false;
          }));

        } else if (self.current_infra.stack.status.type === "NONE") {
          // no stack info
          self.$data.loading = false;
        }
      },
    },
    filters: {
      toLocaleString: toLocaleString,
    },
    computed: {
      no_stack:    function () { return this.current_infra.stack.status.type === 'NONE'; },
      in_progress: function () { return this.current_infra.stack.status.type === 'IN_PROGRESS'; },
      stack_fail:  function () { return this.current_infra.stack.status.type === 'NG'; },
      no_resource: function () {
        return this.current_infra.stack.status.type === 'OK' &&
          _(this.current_infra.resources).values().flatten().value().length === 0;
      },

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
      self.$watch('$route.params.infra_id', function (val) {
        self.reset();
      });
      self.reset(self.initial_tab);
    },
  };
};
