//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


(function () {
  'use strict';

  google.load('visualization',   '1.0',   {'packages':['corechart']});

  var current_infra = null;
  var app;

  ZeroClipboard.config({swfPath: '/assets/ZeroClipboard.swf'});

// ================================================================
// infrastructures
// ================================================================

//browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  //var infraindex = require('./modules/loadindex');
  var newVM = require('./modules/newVM');
  var queryString = require('query-string').parse(location.search);
  //browserify modules for Vue directives
  var CFTemplate     = require('models/cf_template').default;
  var Infrastructure = require('models/infrastructure').default;
  var S3Bucket       = require('models/s3_bucket').default;
  var Dish           = require('models/dish').default;
  var EC2Instance    = require('models/ec2_instance').default;
  var Monitoring     = require('models/monitoring').default;
  var RDSInstance    = require('models/rds_instance').default;
  var Resource       = require('models/resource').default;
  var Snapshot       = require('models/snapshot').default;
  var modal          = require('modal');

  Vue.use(require('./modules/datepicker'), queryString.lang);
  Vue.use(require('./modules/timepicker'), queryString.lang);

  var vace = require('vue-ace');
  require('brace/mode/json');
  require('brace/theme/github');
  Vue.use(vace, false, 'json', '25');

  // Vueに登録したfilterを、外から見る方法ってないのかな。
  var jsonParseErr = function (str) {
    if (_.trim(str) === '') {
      return 'JSON String is empty. Please input JSON.';
    }
    try {
      JSON.parse(str);
    } catch (ex) {
      return ex;
    }
  };

  var toLocaleString = function (datetext) {
    var date = new Date(datetext);
    return date.toLocaleString();
  };


  // Utilities
  var alert_success = function (callback) {
    return function (msg) {
      var dfd = modal.Alert(t('infrastructures.infrastructure'), msg);
      if (callback) {
        dfd.done(callback);
      }
    };
  };

  var alert_danger = function (callback) {
    return function (msg) {
      if (!jsonParseErr(msg) && JSON.parse(msg).error) {
        modal.AlertForAjaxStdError(callback)(msg);
      } else {
        var dfd = modal.Alert(t('infrastructures.infrastructure'), msg, 'danger');
        if (callback) { dfd.done(callback); }
      }
    };
  };

  var alert_and_show_infra = alert_danger(function () {
    show_infra(current_infra.id);
  });

  Vue.component("stack-events-table", {
    props: { events: Array, },
    template: '#stack-events-table-template',
    methods: {
      event_tr_class: function (status) {
        if      (status === "CREATE_COMPLETE")    { return "success"; }
        else if (status.indexOf("FAILED") !== -1) { return "danger"; }
        else if (status.indexOf("DELETE") !== -1) { return "warning"; }
        return '';
      },
      toLocaleString: toLocaleString,
    },
    created: function () {
      var self = this;
      console.log(self);
      this.$watch('events', function () {
        $(self.$el).hide().fadeIn(800);
      });
    },
  });

  Vue.component("add-modify-tabpane", {
    props: {
      templates: {
        type: Object,
        required: true,
      },
      result: {
        type: Object,
        required: true,
      },
    },
    data: function(){
      return{selected_cft_id: null,};},
    template: '#add-modify-tabpane-template',
    methods: {
      select_cft: function () {
        var self = this;
        var cft = _.find(self.templates.histories.concat(self.templates.globals), function (c) {
          return c.id === self.selected_cft_id;
        });
        self.result.name   = cft.name;
        self.result.detail = cft.detail;
        self.result.value  = cft.value;

      },
      submit: function () {
        if (this.jsonParseErr) {return;}
        app.show_tabpane('insert-cf-params');
        app.loading = true;
      },
    },
    computed: {
      jsonParseErr: function () { return jsonParseErr(this.result.value); },
    },

  });


  Vue.component("insert-cf-params", {
    template: '#insert-cf-params-template',
    data: function () {return {
      params: {},
      result: {},
      loading: false,
    };},
    methods: {
      submit: function () {
        this.loading = true;
        var cft = new CFTemplate(current_infra);
        var self = this;
        cft.create_and_send(this.$parent.$data.current_infra.add_modify, this.result).done(alert_success(function () {
          show_infra(current_infra.id);
        })).fail(alert_danger(function () {
          self.loading = false;
        }));
      },

      back: function () { app.show_tabpane('add_modify'); },
    },
    ready: function () {
      var self = this;
      console.log(self);
      var cft = new CFTemplate(current_infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify)
      .fail(alert_danger(function () {
        self.back();
      })).then(function (data) {
        self.params = data;
        _.each(data, function (val, key) {
          Vue.set(self.result, key, val.Default);
        });
        app.loading = false;
      }).then(function () {
        // for project parameter
        Vue.nextTick(function () {
          var inputs = $(self.$el).parent().find('input');
          var project_id = queryString.project_id;
          inputs.textcomplete([
            require('complete_project_parameter').default(project_id),
          ]);
        });
      });
    },
  });

  Vue.component('add-ec2-tabpane', {
    template: '#add-ec2-tabpane-template',
    data: function () {return {
      physical_id: '',
      screen_name: '',
      physical_ids: null,
    };},
    methods: {
      submit: function () {
        var res = new Resource(current_infra);
        res.create(this.physical_id, this.screen_name)
          .done(alert_success(function () {
            show_infra(current_infra.id);
          }))
          .fail(alert_and_show_infra);
      },
    },
    created: function () {
      console.log(this);
      var self = this;
      var res = new EC2Instance(current_infra, "");
      res.available_resources().done(function (data){
        self.physical_ids = data;
      });

      $('#add_ec2_physical_id').selectize({
        delimiter: ',',
        persist: false,
        create: function(input) {
          return {
            value: input,
            text: input
          };
        }
      });
    },
  });

  Vue.component("cf-history-tabpane", {
    template: '#cf-history-tabpane-template',
    data: function () {return {
      id: -1,
      current: null,
      history: [],
    };},
    methods: {
      active: function (id) { return this.id === id; },
      toLocaleString: toLocaleString,

      get: function (id) {
        var self = this;
        self.id = id;

        var cft = new CFTemplate(current_infra);
        cft.show(id).done(function (data) {
          self.current = data;
        }).fail(alert_and_show_infra);
      },
    },
    computed: {
      currentExists: function () { return !!this.current; },
    },
    created: function () {
      var self = this;
      var cft = new CFTemplate(current_infra);
      cft.history().done(function (data) {
        self.history = data;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
  });

  Vue.component("infra-logs-tabpane", {
    template: '#infra-logs-tabpane-template',
    data: function () {return {
      logs: [],
      page: {},
    };},
    methods: {
      status_class: function (status) { return status ? 'label-success' : 'label-danger'; },
      status_text: function (status)  { return status ? 'SUCCESS' : 'FAILED'; },
      toLocaleString: toLocaleString,
    },
    created: function () {
      var self = this;
      console.log(self);
      current_infra.logs().done(function (data) {
        self.logs = data.logs;
        self.page = data.page;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);

      this.$watch('infra_logs', function (newVal, oldVal) {
        $(".popovermore").popover().click( function(e) {
          e.preventDefault();
        });
      });

      this.$on('show', function (page) {
        current_infra.logs(page).done(function (data) {
          self.logs = data.logs;
          self.page = data.page;
        }).fail(alert_and_show_infra);
      });
    },
  });



  // TODO: .active をつける
  Vue.component("monitoring-tabpane", {
    template: "#monitoring-tabpane-template",
    data: function () {return {
      problems: null,
      creating: false,
      before_register: false,
      commons: [],
      uncommons: [],
      resources: [],
      templates: [],
      error_message: null,
      loading_graph: false,
      url_status: [],
      showing_url: false,
      loading_problems: true,
      loading: false,
      page: 0,
      dispItemSize: 10,
      show_range: false,
      dt: null,
      dt2: null,
      physical_id: null,
      item_id: null,
    };},
    methods: {
      show_problems: function () {
        var self = this;
        this.monitoring.show_problems().done(function (data) {
          self.problems = data;
          self.loading_problems = false;
        });
      },
      create: function () {
        if(!this.has_selected) {return;}

        var self = this;
        self.creating = true;
        var templates = _(this.templates).filter(function (t) {
          return t.checked;
        }).map(function (t) {
          return t.name;
        }).value();

        this.monitoring.create_host(templates).done(function () {
          alert_success(function () {
            self.$parent.show_edit_monitoring();
          })(t('monitoring.msg.created'));
        }).fail(alert_and_show_infra);
      },
      show_url: function () {
        var self = this;
        self.loading_graph = true;
        this.monitoring.show_url().done(function (data) {
          // TODO: data が空の場合にエラー表示する
          // TODO: ポーリング
          self.url_status = data;
          self.error_message = null;
          self.loading_graph = false;
          self.showing_url = true;
        }).fail(alert_and_show_infra);
      },
      showDate: function ()  {
        var self = this;
        self.loading_graph = true;
        if(this.dt && this.dt2){
          var dates = [this.dt, this.dt2];
          this.monitoring.show_zabbix_graph(self.physical_id, self.item_key, dates).done(function (data) {
            self.loading_graph = false;
            Vue.nextTick(function () {
              if (data.length === 0) {
                self.error_message = t('monitoring.msg.no_data');
              } else {
                self.error_message = null;
                self.drawChart(data, self.physical_id, self.item_key, ['value']);
              }
            });
          }).fail(alert_and_show_infra);
        }
      },
      drawChart: function (data, physical_id, title_name, columns) {
        var resizable_data = new google.visualization.DataTable();
        var direction;
        if (columns.length === 1) {
          resizable_data.addColumn('datetime', 'DateTime');
          _.forEach(columns, function (col) {
            resizable_data.addColumn('number', col);
          });
          var zabbix_data = data.map(function (obj, i){
            var format_date = new Date(obj[0]);
            return [format_date,obj[1]];
          });
          resizable_data.addRows(zabbix_data);
          resizable_data.sort([{column: 0, asc: true}]);
          direction = 1;
        }else {
          resizable_data.addColumn('string', 'clock');
          _.forEach(columns, function (col) {
            resizable_data.addColumn('number', col);
          });
          resizable_data.addRows(data);
          direction = -1;
        }
        var resizable_options = {
          title: physical_id + " " + title_name,
          titleTextStyle: {
            fontSize: 15,
            fontName: "Meiryo"
          },
          chartArea: {
            width: '90%',
            height: '70%'
          },
          fontSize: 11,
            // setting labels 45 degrees
          hAxis: {
            direction: direction,
            slantedText: true,
            slantedTextAngle: 45
          },
            // remove negative values
          vAxis: {
            viewWindow: {
              min: 0
            },
          },
      		explorer: {
            axis: 'horizontal'
            // axis: 'vertical'
      		}
        };
        if (columns.length === 1) {
          resizable_options.legend = {position: 'none'};
        } else {
          resizable_options.legend = {
            position: 'top',
            alignment: 'center',
          };
        }

        var resizable_chart = new google.visualization.LineChart(document.getElementById("graph"));
        resizable_chart.draw(resizable_data, resizable_options);
      },
      show_zabbix_graph: function (physical_id, item_key) {
        var self = this;
        self.showing_url = false;
        self.loading_graph = true;
        self.physical_id = physical_id;
        self.item_key = item_key;
        this.monitoring.show_zabbix_graph(physical_id, item_key).done(function (data) {
          self.loading_graph = false;
          self.show_range = true;
          Vue.nextTick(function () {
            if (data.length === 0) {
              self.error_message = t('monitoring.msg.no_data');
            } else {
              self.error_message = null;
              self.drawChart(data, physical_id, item_key, ['value']);
            }
          });
        }).fail(alert_and_show_infra);
      },
      show_cloudwatch_graph: function (physical_id) {
        var self = this;
        self.showing_url = false;
        self.show_range = false;
        self.loading_graph = true;
        this.monitoring.show_cloudwatch_graph(physical_id).done(function (data) {
          self.error_message = null;
          self.loading_graph = false;
          Vue.nextTick(function () {
            self.drawChart(data, physical_id, 'NetworkInOut', ['NetworkIn', 'NetworkOut', 'Sum']);
          });
        }).fail(alert_and_show_infra);
      },
      showPrev: function (){
        if(this.isStartPage) return;
        this.page--;
      },
      showNext: function (){
        if(this.isEndPage) return;
        this.page++;
      },
      close: function (){
        this.$parent.show_monitoring();
      },
    },
    computed: {
      monitoring: function ()    { return new Monitoring(current_infra); },
      no_problem: function ()    { return _.isEmpty(this.problems); },
      before_setting: function() { return this.commons.length === 0 && this.uncommons.length === 0; },
      has_selected: function() {
        return _.some(this.templates, function(c){
          return c.checked;
        });
      },
      dispItems: function(){
        var startPage = this.page * this.dispItemSize;
        return this.templates.slice(startPage, startPage + this.dispItemSize);
      },
      isStartPage: function(){
        return (this.page === 0);
      },
      isTo: function(){
        return (!this.dt && this.dt !== '');
      },
      isShow: function(){
        return (!this.dt2 && this.dt2 !== '');
      },
      isEndPage: function(){
        return ((this.page + 1) * this.dispItemSize >= this.templates.length);
      },
    },
    created: function () {
      var self = this;
      var monitoring = new Monitoring(current_infra);
      monitoring.show().done(function (data) {
        self.before_register = data.before_register;
        self.commons         = data.monitor_selected_common;
        self.uncommons       = data.monitor_selected_uncommon;
        self.resources       = data.resources;
        self.templates       = data.templates;

        if (!this.before_register) {
          self.show_problems();
        }
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
    filters: {
      roundup: function (val) { return (Math.ceil(val));},
    },
  });


  Vue.component("edit-monitoring-tabpane", {
    template: "#edit-monitoring-tabpane-template",
    data: function () {return {
      master_monitorings: [],
      selected_monitoring_ids: [],
      web_scenarios: [],
      mysql_rds_host: null,
      postgresql_rds_host: null,
      add_scenario: {},
      loading: false,
      temp_loading: false,
      page: 0,
      dispItemSize: 10,
      templates: [],
      linked_resources: [],
      before_register: false,
      sel_resource: null,
    };},
    methods: {
      type: function (master) { return Monitoring.type(master); },
      edit_temp: function(resource) {
        self = this;
        self.sel_resource = resource;
        self.templates = resource.templates;
      },
      delete_step: function (step) {
        this.web_scenarios = _.filter(this.web_scenarios, function (s) {
          return s[0] !== step[0];
        });
      },
      add_step_err: function () {
        var s = this.add_scenario;
        if (s.scenario_name && !s.scenario_name.match(/^[\w\s]+$/)) {
          return "scenario_name can not contain signs";
        }
        if (s.status_code && !s.status_code.match(/^[0-9]+$/)) {
          return "status code は半角数字でお願いします";
        }
        if (s.timeout && !s.timeout.match(/^[0-9]+$/)) {
          return "Timeout は半角数字でお願いします" ;
        }
        var scenario = [s.scenario_name, s.step_name, s.url, s.required_string, s.status_code, s.timeout];
        if(!_.every(scenario, function(x){
          return x && !(x.match(/^\s*$/));
        })) {
          return "Please fill in the blanks";
        }

        return null;
      },
      add_step: function () {
        var scenario = [
          this.add_scenario.scenario_name,
          this.add_scenario.step_name,
          this.add_scenario.url,
          this.add_scenario.required_string,
          this.add_scenario.status_code,
          this.add_scenario.timeout
        ];

        var s_array = $.map(scenario, function(s, i){
            return (s.trim());
          });

        this.web_scenarios.push(s_array);
        this.add_scenario = {};
      },
      submit: function () {
        this.$event.preventDefault();
        this.loading = true;
        var self = this;
        this.monitoring.update(
            this.master_monitorings,
            this.web_scenarios,
            this.mysql_rds_host,
            this.postgresql_rds_host
        ).done(alert_success(function () {
            self.$parent.show_monitoring();
          }))
          .fail(alert_danger(function () {
            self.loading = false;
          }));
      },
      update_templates: function () {
        if (!this.has_selected) {return;}
        var self = this;
        var templates = _(this.templates).filter(function (t) {
          return t.checked;
        }).map(function(t)  {
          return t.name;
        }).value();
        self.temp_loading = true;
        this.monitoring.update_templates(self.sel_resource.resource, templates).done(function ()  {
          self.temp_loading = false;
          self.$parent.show_edit_monitoring();
        }).fail(alert_and_show_infra);
      },
      showPrev: function () {
        if(this.isStartPage) return;
        this.page--;
      },
      showNext: function () {
        if(this.isEndPage) return;
        this.page++;
      },
    },
    computed: {
      monitoring: function () { return new Monitoring(current_infra); },
      has_selected: function() {
        return _.some(this.templates, function(c){
          return c.checked;
        });
      },
      dispItems: function(){
        var startPage = this.page * this.dispItemSize;
        return this.templates.slice(startPage, startPage + this.dispItemSize);
      },
      isStartPage: function(){
        return (this.page === 0);
      },
      isEndPage: function(){
        return ((this.page + 1) * this.dispItemSize >= this.templates.length);
      },
    },
    created: function () {
      var self = this;
      self.temp_loading = true;
      this.monitoring.edit().done(function (data) {
        self.master_monitorings      = data.master_monitorings;
        self.selected_monitoring_ids = data.selected_monitoring_ids;
        self.web_scenarios           = data.web_scenarios;
        self.mysql_rds_host          = null;
        self.postgresql_rds_host     = null;

        self.$parent.loading = false;
      }).fail(function (xhr) {
        if (xhr.status === 400) { // before register zabbix
          self.$parent.show_monitoring();
        } else {
          alert_and_show_infra(xhr.responseText);
        }
      });

      this.monitoring.show().done(function (data) {
        self.before_register = data.before_register;
        self.linked_resources = data.linked_resources;
        self.$parent.loading = false;
        self.temp_loading = false;
      }).fail(alert_and_show_infra);
    },
    filters: {
      roundup: function (val) { return (Math.ceil(val));},
    },
  });

  Vue.component("vue-paginator", {
    props: {
      page: {
        type: Object,
        required: true,
      },
    },
    template: '#vue-paginator-template',
    methods: {
      isDisable: function (i) {
        if (this.page.current <= i) {
          return this.page.current === this.page.max;
        } else {
          return this.page.current === 1;
        }
      },
      visibleTruncate: function (type) {
        if (type === 'next') {
          return this.page.current + 4 < this.page.max ;
        } else { // 'prev'
          return 0 < this.page.current - 5;
        }
      },
      show: function (page) {
        if (this.isDisable(page)){return;}

        this.$dispatch('show', page);
      },
    },
    computed: {
      visibleNum: function () {
        var self = this;
        return _.filter([0, 1, 2, 3, 4, 5, 6, 7, 8], function (n) {
          var i = n + self.page.current - 4;
          return 0 < i && i <= self.page.max;
        });
      },
    },
    created: function () { console.log(this); },
  });

  Vue.component('rds-tabpane', {
    props: {
      physical_id: {
        type: String,
        required: true,
      },
    },
    data: function () {return {
      rds: {},
      serverspec: {},
    };},
    template: '#rds-tabpane-template',
    methods: {
      change_scale: function () {
        var rds = new RDSInstance(current_infra, this.physical_id);
        rds.change_scale(this.change_scale_type_to).done(function (msg) {
          alert_success(self.reload)(msg);
          $('#change-scale-modal').modal('hide');
        }).fail(function (msg) {
          alert_danger(self.reload)(msg);
          $('#change-scale-modal').modal('hide');
        });
      },
      gen_serverspec: function () {
        var self = this;
        var rds = new RDSInstance(current_infra, this.physical_id);
        rds.gen_serverspec(this.serverspec).done(function (msg) {
          alert_success(self.reload)(msg);
          $('#rds-serverspec-modal').modal('hide');
        }).fail(function (msg) {
          alert_danger(self.reload)(msg);
          $('#rds-serverspec-modal').modal('hide');
        });
      },
      reload: function () { this.$parent.show_rds(this.physical_id); },
    },
    computed: {
      gen_serverspec_enable: function () {
        var s = this.serverspec;
        return !!(s.username && s.password && s.database);
      },
    },
    created: function () {
      var self = this;
      var rds = new RDSInstance(current_infra, this.physical_id);
      rds.show().done(function (data) {
        self.rds = data.rds;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
  });

  // this.physical_id is a elb_name.
  Vue.component('elb-tabpane', {
    props: {
      physical_id: {
        type: String,
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
    template: '#elb-tabpane-template',
    methods: {
      show_ec2: function (physical_id) { this.$parent.show_ec2(physical_id); },

      deregister: function (physical_id) {
        var self = this;
        modal.Confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.deregister'), 'danger').done(function () {
          var ec2 = new EC2Instance(current_infra, physical_id);
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
          var ec2 = new EC2Instance(current_infra, self.selected_ec2);
          var reload = function () {
            self.$parent.show_elb(self.physical_id);
          };
          ec2.register(self.physical_id)
            .done(alert_success(reload))
            .fail(alert_danger(reload));
        });
      },
      state: function (s){
        if (s === 'InService') { return 'success'; }
        else                   { return 'danger'; }
      },
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
        var ec2 = new EC2Instance(current_infra, "");
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
        var ec2 = new EC2Instance(current_infra, "");
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
          var ec2 = new EC2Instance(current_infra, "");
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
        var ec2 = new EC2Instance(current_infra, "");
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
          var ec2 = new EC2Instance(current_infra, "");
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
      check: function (i) {
          i.checked= !i.checked;
      },
      reload: function(){
        this.$parent.show_elb(this.physical_id);
      },
      elb_submit_groups: function(){
        var self = this;
        var ec2 = new EC2Instance(current_infra, '');
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
      current_infra.show_elb(this.physical_id).done(function (data) {
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



  Vue.component('s3-tabpane', {
    template: '#s3-tabpane-template',
    props: {
      physical_id: {
        type: String,
        required: true,
      },
    },
    data: function () {return {html: ""};},
    compiled: function () {
      var self = this;
      var s3 = new S3Bucket(current_infra, this.physical_id);
      s3.show().done(function (res) {
        self.html = res;
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
  });

  Vue.component('view-rules-tabpane', {
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
      }
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
        var ec2 = new EC2Instance(current_infra, this.physical_id);
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
        if(this.instance_type === 'elb')
          this.$parent.show_elb(this.physical_id);
        else
          this.$parent.show_ec2(this.physical_id);
      },
    },
    compiled: function() {
      console.log(this);
      this.get_rules();
      this.$parent.loading = false;
    },
  });

  Vue.component('security-groups-tabpane', {
    template: '#security-groups-tabpane-template',
    props: {
      ec2_instances: {
        type: Array,
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
    };},
    methods: {
      get_rules: function ()  {
        var self = this;
        var ec2 = new EC2Instance(current_infra, '');
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
        var ec2 = new EC2Instance(current_infra, '');
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
    ready: function() {
      console.log(this);
      this.get_rules();
      this.$parent.loading = false;
    },
    filters: {
      trim: function (str) {
        var showChar = 50;
        return (str.length > showChar) ? str.substr(0, showChar)+"..." : str;
      },
    },

  });

  Vue.component('ec2-tabpane', {
    props: {
      physical_id: {
        type: String,
        required: true,
      },
    },
    data: function () {return {
      loading:             false,
      loading_s:           false,
      loading_snapshots:   false,
      loading_groups:      false,
      inprogress:          false, // for cook
      ec2_status_changing: false,
      chef_console_text:   '',
      selected_dish:       null,
      ec2:                 {},
      volume_selected:     '',
      snapshots:           {},
      sort_key:            '',
      sort_asc:            false,
      schedule_type:       '',
      schedule:            {},
      loading_volumes:     false,
      attachable_volumes:  [],
      max_sec_group:       null,
      rules_summary:       null,
      editing_policy:      {},
      page: 0,
      dispItemSize: 10,
      filteredLength: null,
      filterKey: '',
      placement:          'left',
      lang:               queryString.lang,
      sec_group: t('ec2_instances.msg.security_groups'),
      change_status: t('ec2_instances.change_status'),
      attach_vol: t('ec2_instances.attach'),
      changing_status: t('ec2_instances.changing_status'),
    };},
    template: '#ec2-tabpane-template',
    methods: {
      bootstrap: function () {
        var self = this;
        self.loading = true;
        var ec2 = new EC2Instance(current_infra, self.physical_id);

        ec2.bootstrap()
          .done(alert_success(self._show_ec2))
          .fail(alert_danger(self._show_ec2));
      },
      start_ec2: function () {
        if (this.running) {return;}
        if (this.ec2_status_changing) {return;}
        this.ec2_status_changing = true;

        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.start_ec2()
          .done(alert_success(self._show_ec2))
          .fail(alert_danger(self._show_ec2));
      },
      stop_ec2: function () {
        if (this.stopped) {return;}
        if (this.ec2_status_changing) {return;}
        this.ec2_status_changing = true;

        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.stop_ec2()
          .done(alert_success(self._show_ec2))
          .fail(alert_danger(self._show_ec2));
      },
      reboot_ec2: function () {
        if (this.stopped) {return;}
        if (this.ec2_status_changing) {return;}
        this.ec2_status_changing = true;

        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.reboot_ec2()
          .fail(alert_danger(self._show_ec2));
      },
      detach_ec2: function () {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.detach'), 'danger').done(function () {
          ec2.detach_ec2(self.x_zabbix, self.x_chef)
            .done(alert_success(function () {
              show_infra(current_infra.id);
            }))
            .fail(alert_danger(self._show_ec2));
        });

      },
      terminate_ec2: function () {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        modal.Confirm(t('ec2_instances.ec2_instance'), t('ec2_instances.confirm.terminate'), 'danger').done(function () {
          ec2.terminate_ec2()
            .done(alert_success(function () {
              show_infra(current_infra.id);
            }))
            .fail(alert_danger(self._show_ec2));
        });

      },
      _cook: function (method_name, params) {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);

        var dfd = ec2[method_name](params);
        dfd.fail(
          // cook start fail
          alert_danger(self._show_ec2)
        ).progress(function (state, msg) {
          // cook start success
          if(state !== 'start'){return;}

          alert_success(function () {
            self.inprogress = true;
            Vue.nextTick(function () {
              self.watch_cook(dfd);
            });
          })(msg);
        });
      },
      watch_cook: function (dfd) {
        var self = this;
        var infra_id = current_infra.id;
        var el = document.getElementById("cook-status");

        // 更新されるたびにスクロールすると、scrollHeight 等が重い処理なのでブラウザが固まってしまう。
        // そのため、100msに1回スクロールするようにしている。
        (function () {
          var scroll = function () {
            Vue.nextTick(function () {
              el.scrollTop = el.scrollHeight;
              if (self.inprogress) { setTimeout(scroll, 100); }
            });
          };
          scroll();
        })();

        dfd.done(function () {
          if(infra_id !== current_infra.id){return;}
          // cook end
          self.chef_console_text = '';
          self.inprogress = false;
          self._show_ec2();
        }).progress(function (state, msg) {
          if (state !== 'update') {return;}
          if(infra_id !== current_infra.id){return;}

          self.chef_console_text += msg;
        });
      },

      apply_dish: function () {
        var ec2 = new EC2Instance(current_infra, this.physical_id);
        ec2.apply_dish(this.selected_dish)
          .done(alert_success(this._show_ec2))
          .fail(alert_danger(this._show_ec2));
      },
      cook:       function (params) { this._cook('cook', params); },

      yum_update: function (security, exec) {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);

        var security_bool = (security === "security");
        var exec_bool = (exec === "exec");

        modal.Confirm(t('infrastructures.infrastructure'), t('nodes.msg.yum_update_confirm'), 'danger').done(function () {
          var dfd = ec2.yum_update(security_bool, exec_bool).fail(
            // cook start fail
            alert_danger(self._show_ec2)
          ).progress(function (state, msg) {
            // cook start success
            if(state !== 'start'){return;}

            alert_success(function () {
              self.inprogress = true;
              Vue.nextTick(function () {
                self.watch_cook(dfd);
              });
            })(msg);
          });
        });
      },
      edit_runlist: function () {
        this.$parent.tabpaneID = 'edit_runlist';
        this._loading();
      },
      edit_attr: function () {
        this.$parent.tabpaneID = 'edit_attr';
        this._loading();
      },
      select_serverspec: function () {
        this.$parent.tabpaneID = 'serverspec';
        this._loading();
      },
      serverspec_results: function() {
        this.$parent.tabpaneID = 'serverspec_results';
        this._loading();
      },
      view_rules: function () {
        this.$parent.tabpaneID = 'view-rules';
        this.$parent.sec_group = this.ec2.security_groups;
        this._loading();
        this.$parent.instance_type = 'ec2';
      },

      _show_ec2: function () { this.$parent.show_ec2(this.physical_id); },

      _label_class: function (status) {
        if ( status === 'Success') {
          return 'label-success';
        } else if (status === 'Failed') {
          return 'label-danger';
        } else if (status === 'UnExecuted') {
          return 'label-warning';
        } else { // InProgress, Pending and others.
          return 'label-default';
        }
      },

      is_role:      function (run) { return run.indexOf("role") !== -1; },
      is_first:     function (index) { return (index === 0); },
      runlist_type: function (run) { return run.replace(/\[.+\]$/, ""); },
      runlist_name: function (run) { return run.replace(/^.+\[(.+)\]$/, "$1"); },

      _loading: function () { this.$parent.loading = true; },

      change_scale: function () {
        var self = this;
        self.loading = true;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.change_scale(self.change_scale_type_to).done(function (msg) {
          alert_success(self._show_ec2)(msg);
          $('#change-scale-modal').modal('hide');
        }).fail(function (msg) {
          alert_danger(self._show_ec2)(msg);
          $('#change-scale-modal').modal('hide');
        });
      },
      change_schedule: function () {
        switch (this.schedule_type) {
        case 'yum':
          this.change_yum_schedule();
          break;
        case 'snapshot':
          this.change_snapshot_schedule();
          break;
        }
      },
      change_yum_schedule: function () {
        var self = this;
        self.loading_s = true;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.schedule_yum(self.schedule).done(function (msg) {
          self.loading_s = false;
          $('#change-schedule-modal').modal('hide');
          alert_success()(msg);
        }).fail(function (msg) {
          self.loading_s = false;
          alert_danger()(msg);
        });
      },
      change_snapshot_schedule: function () {
        var self = this;
        self.loading_s = true;
        var s = new Snapshot(current_infra.id);
        s.schedule(self.volume_selected, self.physical_id, self.schedule).done(function (msg) {
          self.loading_s = false;
          $('#change-schedule-modal').modal('hide');
          alert_success()(msg);
        }).fail(function (msg) {
          self.loading_s = false;
          alert_danger()(msg);
        });
      },
      is_root_device: function (device_name) {
        return this.ec2.root_device_name === device_name;
      },
      create_snapshot: function (volume_id) {
        var self = this;
        modal.Confirm(t('snapshots.create_snapshot'), t('snapshots.msg.create_snapshot', {volume_id: volume_id})).done(function () {
          var snapshot = new Snapshot(current_infra.id);

          snapshot.create(volume_id, self.physical_id).progress(function (data) {
            modal.Alert(t('snapshots.snapshot'), t('snapshots.msg.creation_started'));
          }).done(function (data) {
            if ($('#snapshots-modal.in').length) {
              self.load_snapshots();
            }
          }).fail(alert_danger());

          self.load_snapshots();
        });
      },
      open_schedule_modal: function () { $('#change-schedule-modal').modal('show'); },
      open_yum_schedule_modal: function () {
        this.schedule_type = "yum";
        this.schedule = this.ec2.yum_schedule;
        this.open_schedule_modal();
      },
      open_snapshot_schedule_modal: function (volume_id) {
        this.schedule_type = "snapshot";
        this.schedule = this.ec2.snapshot_schedules[volume_id];
        this.open_schedule_modal();
      },
      load_snapshots: function () {
        var self = this;
        var snapshot = new Snapshot(current_infra.id);
        this.loading_snapshots = true;
        snapshot.index(this.volume_selected).done(function (data) {
          self.snapshots = _.map(data.snapshots, function (s) {
            s.selected = false;
            return s;
          });
          self.sort_key = '';
          self.sort_by('start_time');
          self.loading_snapshots = false;
        }).fail(alert_danger());
      },
      delete_selected_snapshots: function () {
        var self = this;
        var snapshots    = _.select(this.snapshots, 'selected', true);
        var snapshot_ids = _.pluck(snapshots, 'snapshot_id');
        var confirm_body = t('snapshots.msg.delete_snapshot') + '<br>- ' + snapshot_ids.join('<br>- ');
        modal.Confirm(t('snapshots.delete_snapshot'), confirm_body, 'danger').done(function () {
          var s = new Snapshot(current_infra.id);

          _.each(snapshots, function (snapshot) {
            s.destroy(snapshot.snapshot_id)
              .done(function (msg) {
                self.snapshots.$remove(snapshot);
              })
              .fail(alert_danger());
          });
        });
      },
      snapshot_status: function (snapshot) {
        if (snapshot.state === 'pending') {
          return snapshot.state + '(' + snapshot.progress + ')';
        }
        return snapshot.state;
      },
      select_snapshot: function (snapshot) {
        snapshot.selected = !snapshot.selected;
      },
      sort_by: function (key) {
        if (this.sort_key === key) {
          this.sort_asc = !this.sort_asc;
        } else {
          this.sort_asc = false;
          this.sort_key = key;
        }
        this.snapshots = _.sortByOrder(this.snapshots, key, this.sort_asc);
      },
      sorting_by: function (key) {
        return this.sort_key === key;
      },
      load_volumes: function () {
        if ($("#attachButton.dropdown.open").length) {return;}
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        this.loading_volumes = true;
        ec2.attachable_volumes(this.ec2.availability_zone).done(function (data) {
          self.attachable_volumes = data.attachable_volumes;
          self.loading_volumes = false;
        });
      },
      attach_volume: function (volume_id) {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        modal.Prompt(t('ec2_instances.set_device_name'), t('ec2_instances.device_name')).done(function (device_name) {
          ec2.attach_volume(volume_id, device_name).done(function (data) {
            modal.Alert(t('infrastructures.infrastructure'), t('ec2_instances.msg.volume_attached', data)).done(self._show_ec2);
          });
        });
        $("[id^=bootstrap_prompt_]").val(this.suggest_device_name);
      },
      edit_retention_policy: function () {
        var self = this;
        if (Object.keys(self.ec2.retention_policies).includes(self.volume_selected)) {
          self.editing_policy = self.ec2.retention_policies[self.volume_selected];
          self.$set('editing_policy.enabled', true);
        }
        else {
          self.editing_policy = {}
        }
      },
      save_retention_policy: function (volume_id, enabled, max_amount) {
        var self = this;
        var retention_policies = this.ec2.retention_policies;
        var snapshot = new Snapshot(current_infra.id);
        snapshot.save_retention_policy(volume_id, enabled, max_amount)
          .done(function (msg) {
            if (enabled) {
              retention_policies[volume_id] = self.editing_policy;
            }
            else {
              delete retention_policies[volume_id];
            }
            $('#retention-policy-modal').modal('hide');
            alert_success()(msg);
          }).fail(alert_danger());
      },
      toLocaleString: toLocaleString,
      capitalize: function (str) {return _.capitalize(_.camelCase(str));},
      get_security_groups: function (){
        var self = this;
        self.loading_groups = true;
        var ec2 = new EC2Instance(current_infra, this.physical_id);
        ec2.get_security_groups().done(function (data) {
          self.rules_summary = data.params;
          self.loading_groups = false;
          self.filteredLength = data.params.length;
        });
      },
      check: function (i) {
          i.checked= !i.checked;
      },
      submit_groups: function(){
        var self = this;
        var ec2 = new EC2Instance(current_infra, this.physical_id);
        var group_ids = this.rules_summary.filter(function (t) {
          return t.checked;
        }).map(function (t) {
          return t.group_id;
        });

        ec2.submit_groups(group_ids)
          .done(alert_success(self.show_ec2))
          .fail(alert_danger(self.show_ec2));

      },
      showPrev: function (){
        if(this.isStartPage) return;
        this.page--;
      },
      showNext: function (){
        if(this.isEndPage) return;
        this.page++;
      },
    },
    computed: {
      ec2_btn_class: function () {
        if (this.running) {
          return 'btn-success';
        }
        return 'btn-default';
      },
      has_selected: function() {
        return this.rules_summary.some( function(c){
          return c.checked;
        });
      },
      cook_status_class:       function () { return this._label_class(this.cook_status); },
      serverspec_status_class: function () { return this._label_class(this.serverspec_status); },
      update_status_class:     function () { return this._label_class(this.update_status); },

      cook_status:       function () { return this.capitalize(this.ec2.info.cook_status.value); },
      serverspec_status: function () { return this.capitalize(this.ec2.info.serverspec_status.value); },
      update_status:     function () { return this.capitalize(this.ec2.info.update_status.value); },

      cook_time:       function () { return this.cook_status       === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.cook_status.updated_at);},
      serverspec_time: function () { return this.serverspec_status === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.serverspec_status.updated_at);},
      update_time:     function () { return this.update_status     === 'UnExecuted' ? '' : toLocaleString(this.ec2.info.update_status.updated_at);},

      runlist_empty: function () { return _.isEmpty(this.ec2.runlist); },
      dishes_empty:  function () { return _.isEmpty(this.ec2.dishes); },

      running: function () { return this.ec2.status === 'running'; },
      stopped: function () { return this.ec2.status === 'stopped'; },

      dish_option: function () { return [{text: 'Select!', value: '0'}].concat(this.ec2.dishes.map(function (dish) {
        return {text: dish.name, value: dish.id};
      }));},

      next_run:    function () { return (new Date().getHours() + parseInt(this.schedule.time, 10)) % 24; },
      filled_all:  function () {
        if (!this.schedule.enabled) return true;
        switch (this.schedule.frequency) {
          case 'weekly':
            return this.schedule.day_of_week && this.schedule.time;
          case 'daily':
            return this.schedule.time;
          case 'intervals':
            return parseInt(this.schedule.time, 10);
          default:
            return false;
        }
      },
      selected_any: function () { return _.any(this.snapshots, 'selected', true); },
      suggest_device_name: function () {
        // TODO: iikanji ni sitai
        var suggested_device_letter_code = 102; // same as aws default 'f'
        var device_letter_codes = _(this.ec2.block_devices).chain()
          .pluck('device_name')
          .map(function (name) {
            if (/sd([a-z])$/.test(name)) {
              var letter = name.slice(-1);
              if ('a' <= letter && letter <= 'z') {
                return letter.charCodeAt(0);
              } else {
                return false;
              }
            } else {
              return false;
            }
          })
          .filter()
          .sort()
          .value();

        while (device_letter_codes.indexOf(suggested_device_letter_code) !== -1) {
          if (suggested_device_letter_code === 122) { // 'z'
            suggested_device_letter_code = 63;        // '?'
            break;
          }
          suggested_device_letter_code++;
        }

        return '/dev/sd' + String.fromCharCode(suggested_device_letter_code);
      },
      dispItems: function(){
        var startPage = this.page * this.dispItemSize;
        if (this.filterKey === ''){
          return this.rules_summary.slice(startPage, startPage + this.dispItemSize);
        }
        else{
          return this.rules_summary;
        }
      },
      isStartPage: function(){
        return (this.page === 0);
      },
      isEndPage: function(){
        return ((this.page + 1) * this.dispItemSize >= this.rules_summary.length);
      }
    },
    ready: function () {
      var self = this;
      console.log(self);

      var ec2 = new EC2Instance(current_infra, this.physical_id);
      ec2.show().done(function (data) {
        self.ec2 = data;
        self.max_sec_group = data.security_groups.length-1;
        var dish_id = '0';
        if (self.ec2.selected_dish) {
          dish_id = self.ec2.selected_dish.id;
        }
        self.selected_dish = dish_id;

        self.$watch('selected_dish', function (dish_id) {
          var dish = new Dish();
          dish.runlist(dish_id).done(function (runlist) {
            self.ec2.runlist = runlist;
          });
        });

        if (self.ec2.info.cook_status === 'InProgress' || self.ec2.info.update_status === 'InProgress') {
          var dfd = $.Deferred();
          ec2.watch_cook(dfd);  // watch WebSocket and trigger event.
          self.watch_cook(dfd); // watch dfd event and update DOM.
          self.inprogress = true;
        }
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);

      var client = new ZeroClipboard($(".zeroclipboard-button"));
      client.on("ready", function (ready_event) {
        client.on("aftercopy", function (event) {
          var btn = $(event.target);
          var target = btn.find('.copied-hint-target');
          var hint_text = btn.attr('data-copied-hint');
          var orig_text = target.attr('data-orig-text');
          if (!orig_text) {
            orig_text = target.text();
            target.attr('data-orig-text', orig_text);
          }
          target.text(hint_text);
          setTimeout(function () { target.text(orig_text); }, 1000);
        });
      });

      $('#snapshots-modal').on('show.bs.modal', function (e) {
        $(e.target).children().attr('style', null);
        self.load_snapshots();
      });
      $("#snapshots-modal >").draggable({
        cursor: "move",
        containment: ".modal-backdrop",
        handle: ".modal-header"
      });
    },
    filters: {
      zero_as_null: function (str) { return (str === 0) ? null : str; },
      roundup: function (val) { return (Math.ceil(val));},
      count: function (arr) {
        // record length
        this.$set('filteredLength', arr.length);
        // return it intact
        return arr;
      },
    },
  });

  Vue.component('edit-runlist-tabpane', {
    template: '#edit-runlist-tabpane-template',
    data: function () {return {
      recipes:           {},
      selected_cookbook: null,
      selected_recipes:  null,
      selected_roles:    null,
      selected_runlist:  null,
      loading:           false,
      runlist:           null,
      cookbooks:         null,
      roles:             null,
    };},
    methods: {
      get_recipes: function () {
        var self = this;
        if (self.recipes[self.selected_cookbook]) { return; }

        self.ec2.recipes(self.selected_cookbook).done(function (data) {
          Vue.set(self.recipes, self.selected_cookbook, data);
        }).fail(alert_danger());
      },
      update: function () {
        var self = this;
        self.loading = true;
        self.ec2.update(self.runlist)
          .done(alert_success(self.show_ec2))
          .fail(alert_danger(self.show_ec2));
      },

      show_ec2: function () { this.$parent.show_ec2(this.physical_id); },

      add_recipe: function () {
        var self = this;
        _.forEach(self.selected_recipes, function (recipe) {
          var name = "recipe[" + self.selected_cookbook + "::" + recipe + "]";
          self._add(name);
        });
        return;
      },
      add_role: function () {
        var self = this;
        _.forEach(self.selected_roles, function (role) {
          var name = "role[" + role + "]";
          self._add(name);
        });
      },
      _add: function (run) {
        if (_.include(this.runlist, run)) { return; }
        this.runlist.push(run);
      },
      del: function () {
        this.runlist = _.difference(this.runlist, this.selected_runlist);
      },
      up: function () {
        var self = this;
        _.forEach(this.selected_runlist, function (v) {
          var idx = _.indexOf(self.runlist, v);
          self._swap(idx, idx-1);
        });
      },
      down: function () {
        var self = this;
        // XXX: 複数個選択した時にうまく動いてない気がする
        _(self.selected_runlist).reverse().forEach(function (v) {
          var idx = _.indexOf(self.runlist, v);
          self._swap(idx, idx+1);
        }).value();
      },
      _swap: function (from, to) {
        var m = this.runlist.length -1;
        if (from < 0 || m < from || to < 0 || m < to) {
          return;
        }
        var r = _.clone(this.runlist);
        r[to]   = this.runlist[from];
        r[from] = this.runlist[to];
        this.runlist = r;
      }
    },
    computed: {
      current_recipes: function () { return this.recipes[this.selected_cookbook] || []; },
      physical_id:     function () { return this.$parent.tabpaneGroupID; },
      ec2:             function () { return new EC2Instance(current_infra, this.physical_id); },
    },
    created: function () {
      var self = this;
      console.log(self);

      self.ec2.edit().done(function (data) {
        self.runlist   = data.runlist;
        self.cookbooks = data.cookbooks;
        self.roles     = data.roles;
        self.$parent.loading = false;
      }).fail(alert_danger(self.show_ec2));
    }
  });

  Vue.component("edit-attr-tabpane", {
    template: '#edit-attr-tabpane-template',
    data: function () {return {
      attributes: null,
      loading:    false,
    };},
    methods: {
      update: function () {
        var self = this;
        self.loading = true;
        self.ec2.update_attributes(self.attributes)
          .done(alert_success(self.show_ec2))
          .fail(alert_danger(self.show_ec2));
      },

      use_default: function (attr) { attr.value = attr.default; },
      show_ec2:    function ()     { this.$parent.show_ec2(this.physical_id); },
    },
    filters: {
      toID: function (name) { return name.replace(/\//g, '-'); },
    },
    computed: {
      physical_id: function () { return this.$parent.tabpaneGroupID; },
      ec2:         function () { return new EC2Instance(current_infra, this.physical_id); },
      empty:       function () { return _.isEmpty(this.attributes); },
    },
    created: function () {
      var self = this;
      self.ec2.edit_attributes().done(function (data) {
        self.attributes = data;
        self.$parent.loading = false;
        Vue.nextTick(function () {
          var inputs = $(self.$el).parent().find('input');
          var project_id = queryString.project_id;
          inputs.textcomplete([
            require('complete_project_parameter').default(project_id),
          ]);
        });
      }).fail(alert_danger(self.show_ec2));
    },
  });

  Vue.component('serverspec-results-tabpane', {
    template: '#serverspec-results-tabpane-template',
    replace: true,
    props: {
      data: {
        type: Array,
        required: false,
      },
      columns: Array,
      filterKey: String
    },
    data: function () {
      var sortOrders = {};
      this.columns.forEach(function (key) {
        sortOrders[key] = 1;
      });
      return {
        sortKey: '',
        sortOrders: sortOrders,
        option: ['serverspec_results'],
        lang: null,
        pages: 10,
        pageNumber: 0,
      };
    },
    methods:{
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
      sortBy: function (key) {
          if(key !== 'id')
            this.sortKey = key;
            this.sortOrders[key] = this.sortOrders[key] * -1;
      },
      showPrev: function(){
          if(this.pageNumber === 0) return;
          this.pageNumber--;
      },
      showNext: function(){
          if(this.isEndPage) return;
          this.pageNumber++;
      },
    },
    computed: {
      physical_id: function () { return this.$parent.tabpaneGroupID; },
      ec2:         function () { return new EC2Instance(current_infra, this.physical_id); },
      all_spec:    function () { return this.globals.concat(this.individuals); },
      isStartPage: function(){
          return (this.pageNumber === 0);
      },
      isEndPage: function(){
          return ((this.pageNumber + 1) * this.pages >= this.data.length);
      },
    },
    filters:{
      wrap: wrap,
      listen: listen,
      paginate: function(list) {
        var index = this.pageNumber * this.pages;
        return list.slice(index, index + this.pages);
      },
      roundup: function (val) { return (Math.ceil(val));},
    },
    created: function ()  {
      self = this;
      var self = this;
      self.columns = ['serverspec', 'resource', 'message', 'status', 'created_at'];
      var temp_id = null;
      var serverspecs = [];
      self.ec2.results_serverspec().done(function (data) {
        self.data = data.map(function (item) {
          var last_log = (item.created_at ? new Date(item.created_at) : '');
            return {
              serverspec: item.serverspecs,
              resource: item.resource.physical_id,
              message: [item.id,
                        item.resource.physical_id,
                        item.message,
                        item.serverspec_result_details],
              status: item.status,
              created_at: last_log.toLocaleString()
            };
        });
        self.$parent.loading = false;
        $("#loading_results").hide();
        var empty = t('serverspecs.msg.empty-results');
        if(self.data.length === 0){ $('#empty_results').show().html(empty);}
      }).fail(alert_danger(self.show_ec2));
    },
  });

  Vue.component('serverspec-tabpane', {
    template: '#serverspec-tabpane-template',
    data: function () {return {
      available_auto_generated: null,
      individuals: null,
      globals: null,
      loading: false,
      loading_s: false,
      enabled: null,
      frequency: null,
      day_of_week: null,
      time: null,
    };},
    methods: {
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
      run: function () {
        var self = this;
        self.loading = true;
        self.ec2.run_serverspec(
          self.globals.concat(self.individuals),
          self.checked_auto_generated
        ).done(function (msg) {
          alert_success(self.show_ec2)(msg);
          self.$parent.update_serverspec_status(self.physical_id);
        }).fail(alert_danger(self.show_ec2));
      },
      change_schedule: function () {
        var self = this;
        self.loading_s = true;
        self.ec2.schedule_serverspec({
          enabled: self.enabled,
          frequency: self.frequency,
          day_of_week: self.day_of_week,
          time: self.time
        }).done(function (msg) {
          self.loading_s = false;
          $('#change-schedule-modal').modal('hide');
          alert_success()(msg);
        }).fail(function (msg) {
          self.loading_s = false;
          alert_danger()(msg);
        });
      }
    },
    computed: {
      physical_id: function () { return this.$parent.tabpaneGroupID; },
      ec2:         function () { return new EC2Instance(current_infra, this.physical_id); },
      all_spec:    function () { return this.globals.concat(this.individuals); },
      can_run:     function () { return !!_.find(this.all_spec, function(s){return s.checked;}) || this.checked_auto_generated; },
      next_run:    function () { return (new Date().getHours() + parseInt(this.time, 10)) % 24; },
      all_filled:  function () {
        if (!this.enabled) return true;
        switch (this.frequency) {
          case 'weekly':
            return this.day_of_week && this.time;
          case 'daily':
            return this.time;
          case 'intervals':
            return parseInt(this.time, 10);
          default:
            return false;
        }
      },
    },
    created: function () {
      var self = this;
      self.ec2.select_serverspec().done(function (data) {
        var schedule = data.schedule;
        self.available_auto_generated = data.available_auto_generated;
        self.individuals = data.individuals || [];
        self.globals = data.globals || [];
        self.enabled = schedule.enabled;
        self.frequency = schedule.frequency;
        self.day_of_week = schedule.day_of_week;
        self.time = schedule.time;

        self.$parent.loading = false;
      }).fail(alert_danger(self.show_ec2));
    }
  });


  Vue.component('operation-sched-tabpane',  {
    template: '#operation-sched-tabpane-template',
    replace: true,
    props: {
      data: Array,
      columns: Array,
      filterKey: String
    },
    data: function () {
      var sortOrders = {};
      this.columns.forEach(function (key) {
        sortOrders[key] = 1;
      });
      return {
      event_loading:   false,
      instances: null,
      dates: [{day: t('operation_scheduler.dates.monday'),   checked: false, value : 1},
              {day: t('operation_scheduler.dates.tuesday'),  checked: false, value : 2},
              {day: t('operation_scheduler.dates.wednesday'),checked: false, value : 3},
              {day: t('operation_scheduler.dates.thursday'), checked: false, value : 4},
              {day: t('operation_scheduler.dates.friday'),   checked: false, value : 5},
              {day: t('operation_scheduler.dates.saturday'), checked: false, value : 6},
              {day: t('operation_scheduler.dates.sunday'),   checked: false, value : 0}],
      default_start: moment().utcOffset ("Asia/Tokyo").startOf('day').hour(7).minute(0).format('YYYY/MM/D H:mm'),
      default_end: moment().utcOffset ("Asia/Tokyo").startOf('day').add(1, 'years').hour(19).minute(0).format('YYYY/MM/D H:mm'),
      time_start: moment().utcOffset ("Asia/Tokyo").startOf('day').hour(7).minute(0).format('H:mm'),
      time_end: moment().utcOffset ("Asia/Tokyo").startOf('day').hour(19).minute(0).format('H:mm'),
      modes: [{desc: t('operation_scheduler.desc.everyday'), value: 1},
        {desc: t('operation_scheduler.desc.weekdays'), value: 2},
        {desc: t('operation_scheduler.desc.weekends'), value: 3},
        {desc: t('operation_scheduler.desc.specific_dates'), value: 4},],
      sel_instance: {
        start_date: null,
        end_date: null,
        start_time: null,
        end_time: null,
        repeat_freq: null,
      },
      sources: [],
      is_specific: null,
      sortKey: '',
      sortOrders: sortOrders,
      option: ['operation_sched'],
      lang: null,
      pages: 10,
      pageNumber: 0,
    };},
    methods: {
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
      sortBy: function (key) {
        if(key !== 'id')
          this.sortKey = key;
        this.reversed[key] = !this.reversed[key];
      },
      showPrev: function(){
        if(this.pageNumber === 0) return;
        this.pageNumber--;
      },
      showNext: function(){
        if(this.isEndPage) return;
        this.pageNumber++;
      },
      repeat_selector: function() {
        if(parseInt(this.sel_instance.repeat_freq) === 1){
          $("#days-selector").hide();
          _.forEach(this.dates, function(item){
            item.checked = true;
          });
        }else if(parseInt(this.sel_instance.repeat_freq) === 2){
          $("#days-selector").hide();
          _.forEach(this.dates, function(item){
            item.checked = !(parseInt(item.value) === 6 || parseInt(item.value) === 0);
          });
        }else if(parseInt(this.sel_instance.repeat_freq) === 3){
          $("#days-selector").hide();
          _.forEach(this.dates, function(item){
            item.checked = (parseInt(item.value) === 6 || parseInt(item.value) === 0);
          });
        }else{
          _.forEach(this.dates, function(item){
            item.checked = false;
            $("#days-selector input").attr('disabled', false);
            $("#days-selector").show();
          });
        }
      },
      pop: function(e){
        if(e === 'duration'){
          $("#duration").popover('toggle');
        }else if(e === 'recurring'){
          $("#recurring").popover('toggle');
        }
      },
      manage_sched: function (instance) {
        var self = this;
        self.sel_instance = instance;
        current_infra.get_schedule(instance.physical_id).done(function  (data){
          self.sel_instance.physical_id = instance.physical_id;
          _.forEach(data, function(item){
            self.sel_instance.start_date = moment(item.start_date).format('YYYY/MM/D H:mm');
            self.sel_instance.end_date = moment(item.end_date).format('YYYY/MM/D H:mm');

          });
        });
      },
      save_sched: function () {
        var self = this;
        self.$parent.loading = true;
        self.sel_instance.dates = self.dates;
        self.sel_instance.start_date = moment(self.sel_instance.start_date).unix();
        self.sel_instance.end_date = moment(self.sel_instance.end_date).unix();
        current_infra.save_schedule(self.sel_instance.physical_id, self.sel_instance).done(function () {
          self.loading = false;
          alert_success(function () {
          })(t('operation_scheduler.msg.saved'));
          self.get_sched(self.sel_instance);
        }).fail(alert_and_show_infra);
      },
      get_sched: function (ec2){
        var self = this;
        self.$parent.show_operation_sched();
        current_infra.get_schedule(ec2.physical_id).done(function  (data){
          console.log(data);
          var events = [];
          events = data.map(function (item) {
            var dow = [];
            if(item.recurring_date.repeats === "other"){
              _.forEach(item.recurring_date.dates, function(date){
                if(date.checked === "true")
                  dow.push(parseInt(date.value));
              });
            }else if(item.recurring_date.repeats === "everyday"){
              dow = [1,2,3,4,5,6,0];
            }else if(item.recurring_date.repeats === "weekdays"){
              dow = [1,2,3,4,5];
            }else{
              dow = [0,6];
            }
            return {
              title: item.resource.physical_id,
              start: moment(item.recurring_date.start_time).utcOffset ("Asia/Tokyo").format('HH:mm'),
              end: moment(item.recurring_date.end_time).utcOffset ("Asia/Tokyo").format('HH:mm'),
              dow: dow,
            };
          });
          $('#calendar').fullCalendar({
            header: {
              left: 'prev,next today',
              center: 'title',
              right: 'month,agendaWeek,agendaDay,agendaFourDay'
            },
            defaultView: 'agendaWeek',
            events: events,
            allDayDefault: false,
            lang: queryString.lang,
            viewRender: function(currentView){
              var minDate = moment(data[0].start_date).utcOffset ("Asia/Tokyo"),
                maxDate = moment(data[0].end_date).utcOffset ("Asia/Tokyo");

              if (minDate >= currentView.start && minDate <= currentView.end) {
                $(".fc-prev-button").prop('disabled', true);
                $(".fc-prev-button").addClass('fc-state-disabled');
              }
              else {
                $(".fc-prev-button").removeClass('fc-state-disabled');
                $(".fc-prev-button").prop('disabled', false);
              }
              // Future
              if (maxDate >= currentView.start && maxDate <= currentView.end) {
                $(".fc-next-button").prop('disabled', true);
                $(".fc-next-button").addClass('fc-state-disabled');
              } else {
                $(".fc-next-button").removeClass('fc-state-disabled');
                $(".fc-next-button").prop('disabled', false);
              }
            }
          });
        });
      },
    },
    computed: {
      has_selected: function() {
        return _.some(this.dates, function(c){
          return c.checked;
        });
      },
      is_specific: function(){
        return (parseInt(this.sel_instance.repeat_freq) === 4);
      },
      save_sched_err: function () {
        var self = this.sel_instance;
        return (self.start_date && self.end_date && self.repeat_freq);
      },
    },
    isStartPage: function(){
      return (this.pageNumber === 0);
    },
    isEndPage: function(){
      return ((this.pageNumber + 1) * this.pages >= this.data.length);
    },
    filters:{
      wrap: wrap,
      listen: listen,
      paginate: function(list) {
        var index = this.pageNumber * this.pages;
        return list.slice(index, index + this.pages);
      },
      roundup: function (val) { return (Math.ceil(val));},
    },
    created: function(){

      var self = this;
      var res = new Resource(current_infra);
      var events = [];
      //TODO: get all assigned dates and print to calendar. :D
      res.index().done(function (resources) {

        self.data = resources.ec2_instances.map(function (item) {
          return {
            physical_id: item.physical_id,
            screen_name: item.screen_name,
            id: item,
          };
        });

        self.$parent.loading = false;
        $("#loading_results").hide();
        var empty = t('serverspecs.msg.empty-results');
        if(self.data.length === 0){ $('#empty_results').show().html(empty);}
      });
    },
    ready: function () {
      var self = this;
      self.$parent.loading = false;
    }
  });

  // register the grid component
  Vue.component('demo-grid', {
    template: '#grid-template',
    replace: true,
    props: {
      data: Array,
      columns: Array,
      filterKey: String
    },
    data: function () {
      var sortOrders = {};
      this.columns.forEach(function (key) {
        sortOrders[key] = 1;
      });
      return {
        sortKey: '',
        sortOrders: sortOrders,
        loading: true,
        option: ['infrastructure'],
        lang: queryString.lang,
        pages: 10,
        pageNumber: 0,
        filteredLength: null,
      };
    },
    methods: {
      sortBy: function (key) {
          if(key !== 'id')
            this.sortKey = key;
            this.sortOrders[key] = this.sortOrders[key] * -1;
      },
      showPrev: function(){
          if(this.pageNumber === 0) return;
          this.pageNumber--;
      },
      showNext: function(){
          if(this.isEndPage) return;
          this.pageNumber++;
      },
    },
    computed: {
      isStartPage: function(){
          return (this.pageNumber === 0);
      },
      isEndPage: function(){
          return ((this.pageNumber + 1) * this.pages >= this.data.length);
      },
    },
    created: function (){
        var self = this;
        self.loading = true;
        var id =  queryString.project_id;
        var monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                          ];
       $.ajax({
           cache: false,
           url:'/infrastructures?&project_id='+id,
           success: function (data) {
             this.pages = data.length;
             var nextColumns = [];
             self.data = data.map(function (item) {
                 var d = new Date(item.created_at);
                 var date = monthNames[d.getUTCMonth()]+' '+d.getDate()+', '+d.getFullYear()+' at '+d.getHours()+':'+d.getMinutes();
                 if(item.project_id > 3){
                   return {stack_name: item.stack_name,
                       region: item.region,
                       keypairname: item.keypairname,
                       created_at: date,
                       //  ec2_private_key_id: item.ec2_private_key_id,
                       status: item.status,
                       id: [item.id,item.status],
                       };
                 }else{
                   return {stack_name: item.stack_name,
                           region: item.region,
                           keypairname: item.keypairname,
                           //  ec2_private_key_id: item.ec2_private_key_id,
                           id: [item.id,item.status],
                   };
                 }
                 self.loading = false;
               });
             self.$emit('data-loaded');
             $("#loading").hide();
             var empty = t('infrastructures.msg.empty-list');
             if(self.data.length === 0){ $('#empty').show().html(empty);}
             self.filteredLength = data.length;
           }
         });
    },
    filters:{
      wrap: wrap,
      listen: listen,
      paginate: function(list) {
        var index = this.pageNumber * this.pages;
        return list.slice(index, index + this.pages);
      },
      roundup: function (val) { return (Math.ceil(val));},
      count: function (arr) {
        // record length
        this.$set('filteredLength', arr.length);
        // return it intact
        return arr;
      },
    }
 });


  var stack_in_progress = function (infra) {
    infra.stack_events().done(function (res) {
      if(infra.id !== current_infra.id){return;}
      app.$data.current_infra.events = res.stack_events;

      if (res.stack_status.type === 'IN_PROGRESS') {
        setTimeout(function () {
          stack_in_progress(infra);
        }, 15000);
      } else {
        show_infra(current_infra.id);
      }
    });
  };

  var SHOW_INFRA_ID = '#infra-show';

  var show_infra = function (infra_id) {
    current_infra = new Infrastructure(infra_id);

    var l = new Loader();
    l.text = "Loading...";
    l.$mount(SHOW_INFRA_ID);
    if (app) {
      app.$destroy();
    }
    current_infra.show().done(function (stack) {
      app = newVM(stack,
        Resource,
        EC2Instance,
        current_infra,
        CFTemplate,
        alert_danger,
        stack_in_progress,
        ''
      );
      l.$destroy();
      app.$mount(SHOW_INFRA_ID);
    });
  };

  var show_sched = function (infra_id) {
    current_infra = new Infrastructure(infra_id);

    var l = new Loader();
    l.text = "Loading...";
    l.$mount(SHOW_INFRA_ID);
    if (app) {
      app.$destroy();
    }
    current_infra.show().done(function (stack) {
      app = newVM(
        stack,
        Resource,
        EC2Instance,
        current_infra,
        CFTemplate,
        alert_danger,
        stack_in_progress,
        'show_sched'
      );
      l.$destroy();
      app.$mount(SHOW_INFRA_ID);
    });
  };


  var detach = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          location.reload();
        });
      }).fail(modal.AlertForAjaxStdError()).always(l.$destroy);
    });
  };

  var delete_stack = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          show_infra(infra_id);
        });
        // TODO: reload
      }).fail(modal.AlertForAjaxStdError(function () {
        show_infra(infra_id);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  var new_ec2_key = function () {
    modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).done(function () {
      modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name')).done(function (name) {
        if(!name){
          modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
          return;
        }

        var region_input = $('#infrastructure_region');
        var region = region_input.val();
        var project_id = $('#infrastructure_project_id').val();

        $.ajax({
          url: '/ec2_private_keys',
          type: 'POST',
          data: {
            name:       name,
            region:     region,
            project_id: project_id,
          },
        }).done(function (key) {
          var value = key.value;
          var textarea = $('#keypair_value');
          var keypair_name = $('#keypair_name');
          textarea.val(value);
          textarea.attr('readonly', true);
          keypair_name.val(name);
          keypair_name.attr('readonly', true);
          region_input.attr('readonly', true);

          // download file.
          var file = new File([value], name + '.pem');
          var url = window.URL.createObjectURL(file);
          var a = document.createElement('a');
          a.href = url;
          a.setAttribute('download', file.name);
          document.body.appendChild(a);
          a.click();
        }).fail(function (xhr) {
          modal.Alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
        });
      });
    });
  };

  Vue.transition('fade', {
    leave: function (el, done) {
      $(el).fadeOut('normal');
    }
  });


// ================================================================
// event bindings
// ================================================================
  var index = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: [],
      gridData: []
    },
    created: function(){
        if (queryString.project_id >3)
          this.gridColumns = ['stack_name','region', 'keypairname', 'created_at', 'status', 'id'];
        else
          this.gridColumns = ['stack_name','region', 'keypairname', 'id'];
    },
  });


  $(document).ready(function(){

    $('#infrastructure_region').selectize({
      create: false,
      sortField: 'text'
    });
    moment.locale(queryString.lang);

  });

  $(document).on('click', '.show-infra', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_infra(infra_id);
  });

  $(document).on('click', '.operation-sched', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_sched(infra_id);
  });

  $(document).on('click', '.detach-infra', function (e) {
    e.preventDefault();
    var infra_id = $(this).attr('infrastructure-id');

    detach(infra_id);
  });

  $(document).on('click', '.delete-stack', function (e) {
    e.preventDefault();
    var infra_id = $(this).attr('infrastructure-id');

    delete_stack(infra_id);
  });

  $(document).on('click', '.create_ec2_key', function (e) {
    e.preventDefault();
    new_ec2_key();
  });
})();
