//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//= require models/base
//= require models/cf_template
//= require models/infrastructure
//= require models/s3_bucket
//= require models/dish
//= require models/ec2_instance
//= require models/monitoring
//= require models/rds_instance
//= require models/resource
//= require models/snapshot


(function () {
  'use strict';

  google.load('visualization',   '1.0',   {'packages':['corechart']});

  var current_infra = null;

  ZeroClipboard.config({swfPath: '/assets/ZeroClipboard.swf'});

// ================================================================
// infrastructures
// ================================================================

//browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  var parseURLParams = require('./modules/getURL');
  var infraindex = require('./modules/loadindex');
  var http = require('http');

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
      var dfd = bootstrap_alert(t('infrastructures.infrastructure'), msg);
      if (callback) {
        dfd.done(callback);
      }
    };
  };

  var alert_danger = function (callback) {
    return function (msg) {
      if (!jsonParseErr(msg) && JSON.parse(msg).error) {
        modal_for_ajax_std_error(callback)(msg);
      } else {
        var dfd = bootstrap_alert(t('infrastructures.infrastructure'), msg, 'danger');
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
    data: function(){return{selected_cft_id: null};},
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
    created: function () {
      console.log(this);
    }
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
    created: function () {
      var self = this;
      console.log(self);
      var cft = new CFTemplate(current_infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify).done(function (data) {
        self.params = data;
        _.each(data, function (val, key) {
          self.result.$add(key, val.Default);
        });
        app.loading = false;
      }).fail(alert_danger(function () {
        self.back();
      }));
    },
  });

  Vue.component('add-ec2-tabpane', {
    template: '#add-ec2-tabpane-template',
    data: function () {return {
      physical_id: '',
      screen_name: '',
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
    created: function () {console.log(this);},
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
      drawChart: function (data, physical_id, title_name, columns) {
        var resizable_data = new google.visualization.DataTable();

        resizable_data.addColumn('string', 'clock');
        _.forEach(columns, function (col) {
          resizable_data.addColumn('number', col);
        });
        resizable_data.addRows(data);

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
            direction: -1,
            slantedText: true,
            slantedTextAngle: 45
          },
            // remove negative values
          vAxis: {
            viewWindow: {
              min: 0
            },
          },
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
        this.monitoring.show_zabbix_graph(physical_id, item_key).done(function (data) {
          self.loading_graph = false;
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
        console.log(this.page);
      },
      showNext: function (){
        if(this.isEndPage) return;
        this.page++;
        console.log(this.page);
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

  Vue.component("update-template-tabpane",{
    template: "#update-template-tabpane-template",
    data: function(){return{
      loading: false,
      page: 0,
      dispItemSize: 10,
      templates: [],
      before_register: false,
    };},
    methods:{
      update_templates: function () {
        if (!this.has_selected) {return;}
        var self = this;
        self.loading = true;
        var templates = _(this.templates).filter(function (t) {
          return t.checked;
        }).map(function(t)  {
          return t.name;
        }).value();

        this.monitoring.update_templates(templates).done(function ()  {
          self.loading = false;
          self.$parent.show_update_template();
          alert_success(function (){
          })(t('monitoring.msg.update_templates'));
        }).fail(alert_and_show_infra);
      },
      showPrev: function () {
        if(this.isStartPage) return;
        this.page--;
        console.log(this.page);
      },
      showNext: function () {
        if(this.isEndPage) return;
        this.page++;
        console.log(this.page);
      },
      close: function ()  {
        this.$parent.show_update_template();
      },
    },
    computed:{
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
      var monitoring = new Monitoring(current_infra);
      monitoring.show().done(function (data) {
        self.before_register = data.before_register;
        self.templates       = data.templates;
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
    };},
    methods: {
      type: function (master) { return Monitoring.type(master); },

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
    },
    computed: {
      monitoring: function () { return new Monitoring(current_infra); },
    },
    created: function () {
      var self = this;
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
      rds: null,
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
    compiled: function () {
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
    };},
    template: '#elb-tabpane-template',
    methods: {
      show_ec2: function (physical_id) { this.$parent.show_ec2(physical_id); },

      deregister: function (physical_id) {
        var self = this;
        bootstrap_confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.deregister'), 'danger').done(function () {
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
        bootstrap_confirm(t('infrastructures.infrastructure'), t('ec2_instances.confirm.register')).done(function () {
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
      expiration_date: function (date_str) {
        if (!date_str) { return ""; }

        return toLocaleString(date_str);
      },

      panel_class: function (state) { return 'panel-' + this.state(state);},
      label_class: function (state) { return 'label-' + this.state(state);},
    },
    compiled: function () {
      var self = this;
      current_infra.show_elb(this.physical_id).done(function (data) {
        self.ec2_instances = data.ec2_instances;
        self.unregistereds = data.unregistereds;
        self.dns_name = data.dns_name;
        self.listeners = data.listeners;

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
      cook:       function () { this._cook('cook'); },

      yum_update: function (security, exec) {
        var self = this;
        var ec2 = new EC2Instance(current_infra, self.physical_id);

        var security_bool = (security === "security");
        var exec_bool = (exec === "exec");

        bootstrap_confirm(t('infrastructures.infrastructure'), t('nodes.msg.yum_update_confirm'), 'danger').done(function () {
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
        bootstrap_confirm(t('snapshots.create_snapshot'), t('snapshots.msg.create_snapshot', {volume_id: volume_id})).done(function () {
          var snapshot = new Snapshot(current_infra.id);

          snapshot.create(volume_id, self.physical_id).progress(function (data) {
            bootstrap_alert(t('snapshots.snapshot'), t('snapshots.msg.creation_started'));
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
        bootstrap_confirm(t('snapshots.delete_snapshot'), confirm_body, 'danger').done(function () {
          var s = new Snapshot(current_infra.id);

          _.each(snapshots, function (snapshot) {
            s.destroy(snapshot.snapshot_id).done(function (msg) {
              self.snapshots.$remove(snapshot);
            });
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
      toLocaleString: toLocaleString,
      capitalize: function (str) {return _.capitalize(_.camelCase(str));}
    },
    computed: {
      ec2_btn_class: function () {
        if (this.running) {
          return 'btn-success';
        }
        return 'btn-default';
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
    },
    ready: function () {
      var self = this;
      console.log(self);

      var ec2 = new EC2Instance(current_infra, this.physical_id);
      ec2.show().done(function (data) {
        self.ec2 = data;

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
          self.recipes.$add(self.selected_cookbook, data);
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
      }).fail(alert_danger(self.show_ec2));
    },
  });

  Vue.component('serverspec-results-tabpane', {
    template: '#serverspec-results-tabpane-template',
    data: function () {return {
        data: null,
        columns: null,
        sortKey: '',
        filterKey: '',
        reversed: {},
        option: ['serverspec_results'],
        lang: null,
        pages: 10,
        pageNumber: 0,
      };
    },
    compiled: function () {
      // initialize reverse state
        var self = this;
        this.columns.forEach(function (key) {
            self.reversed.$add(key, false);
         });
    },
    methods:{
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
      sortBy: function (key) {
          if(key !== 'id')
            this.sortKey = key;
            this.reversed[key] = !this.reversed[key];
      },
      parseURLParams: parseURLParams,
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
    created: function ()  {
      self = this;
      var self = this;
      self.columns = ['serverspec', 'resource', 'message', 'status', 'created_at'];
      var temp_id = null;
      var serverspecs = [];
      self.ec2.results_serverspec().done(function (data) {
        console.log(data);
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
    filters:{
      wrap: wrap,
      listen: listen,
      paginate: function(list) {
        var index = this.pageNumber * this.pages;
        return list.slice(index, index + this.pages);
      },
      roundup: function (val) { return (Math.ceil(val));},
    }
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

  var newVM = function (stack) {
    return new Vue({
      template: '#infra-show-template',
      data: {
        current_infra: {
          stack: stack,
          resources : {},
          events: [],
          templates: {histories: null, globals: null},
          add_modify: {name: "", detail: "", value: ""},
        },
        tabpaneID: 'default',     // tabpane 一つ一つのID. これに対応する tab の中身が表示される
        tabpaneGroupID: null,     // 複数の tabpane をまとめるID. これに対応する tab が表示される
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
            if (instance.type_name === "AWS::EC2::Instance") {
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
  var app;





  // register the grid component
  Vue.component('demo-grid', {
    template: '#grid-template',
    replace: true,
    props: ['data', 'columns', 'filter-key'],
    data: function () {
      return {
        data: null,
        columns: null,
        sortKey: '',
        filterKey: '',
        reversed: {},
        loading: true,
        option: ['infrastructure'],
        lang: null,
        pages: 10,
        pageNumber: 0,
          };
      },
    compiled: function () {
      // initialize reverse state
        var self = this;
        this.columns.forEach(function (key) {
            self.reversed.$add(key, false);
         });
    },
    methods: {
      sortBy: function (key) {
          if(key !== 'id')
            this.sortKey = key;
            this.reversed[key] = !this.reversed[key];
      },
      parseURLParams: parseURLParams,
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
        var il = new Loader();
        var self = this;
        self.loading = true;
        var id =  this.parseURLParams('project_id');
        self.lang = this.parseURLParams('lang');
        var monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                          ];
        if (id >3)
          self.columns = ['stack_name','region', 'keypairname', 'created_at', 'status', 'id'];
        else
          self.columns = ['stack_name','region', 'keypairname', 'id'];

       $.ajax({
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
                       id: item.id,
                       };
                 }else{
                   return {stack_name: item.stack_name,
                           region: item.region,
                           keypairname: item.keypairname,
                           //  ec2_private_key_id: item.ec2_private_key_id,
                           id: item.id,
                   };
                 }
                 self.loading = false;
               });
             self.$emit('data-loaded');
             $("#loading").hide();
             var empty = t('infrastructures.msg.empty-list');
             if(self.data.length === 0){ $('#empty').show().html(empty);}
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

  var index = function(){

    if (app){
      app.$destroy();
    }else{
      infraindex = infraindex();
    }

  };

  var SHOW_INFRA_ID = '#infra-show';

  var show_infra = function (infra_id) {
    current_infra = new Infrastructure(infra_id);

    var l = new Loader();
    l.$mount(SHOW_INFRA_ID);
    if (app) {
      app.$destroy();
    }
    current_infra.show().done(function (stack) {
      app = newVM(stack);
      l.$destroy();
      app.$mount(SHOW_INFRA_ID);
    });
  };


  var detach = function (infra_id) {
    bootstrap_confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done(function (msg) {
        bootstrap_alert(t('infrastructures.infrastructure'), msg).done(function () {
          location.reload();
        });
      }).fail(modal_for_ajax_std_error()).always(l.$destroy);
    });
  };

  var delete_stack = function (infra_id) {
    bootstrap_confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done(function (msg) {
        bootstrap_alert(t('infrastructures.infrastructure'), msg).done(function () {
          show_infra(infra_id);
        });
        // TODO: reload
      }).fail(modal_for_ajax_std_error(function () {
        show_infra(infra_id);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  var new_ec2_key = function () {
    bootstrap_confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).done(function () {
      bootstrap_prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name')).done(function (name) {
        if(!name){
          bootstrap_alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
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
          bootstrap_alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
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
  $(document).ready(function(){
    index();
  });


  $(document).on('click', '.show-infra', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_infra(infra_id);
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
