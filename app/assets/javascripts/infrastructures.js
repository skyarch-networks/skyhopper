//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//= require_tree ./models/.


(function () {
  'use strict';

  google.load('visualization',   '1.0',   {'packages':['corechart']});

  var current_infra = null;

// ================================================================
// infrastructures
// ================================================================


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
      var dfd = bootstrap_alert(t('infrastructures.infrastructure'), msg, 'danger');
      if (callback) {
        dfd.done(callback);
      }
    };
  };

  var alert_and_show_infra = alert_danger(function () {
    show_infra(current_infra.id);
  });

  var Loader = Vue.extend({
    template: '<span><div class="loader"></div>{{text | format}}</span>',
    created: function () {
      this.$set('text', t('common.msg.loading'));
    },
    filters: {
      format: function (str) {
        return ' ' + str;
      }
    }
  });
  Vue.component('div-loader', Loader);

  Vue.component("stack-events-table", {
    template: '#stack-events-table-template',
    methods: {
      event_tr_class: function (status) {
        if (status === "CREATE_COMPLETE") {
          return "success";
        }
        else if (status.indexOf("FAILED") !== -1) {
          return "danger";
        }
        else if (status.indexOf("DELETE") !== -1) {
          return "warning";
        }
        return '';
      },
    },
    created: function () {
      var self = this;
      this.$watch('events', function () {
        // XXX: jquery
        $(self.$el).hide().fadeIn(800);
      });
    },
  });

  Vue.component("add-modify-tabpane", {
    template: '#add-modify-tabpane-template',
    methods: {
      select_cft: function () {
        var self = this;
        var cft = _.find(self.histories.concat(self.globals), function (c) {
          return c.id === self.selected_cft_id;
        });
        self.$set('name',   cft.name);
        self.$set('detail', cft.detail);
        self.$set('value',  cft.value);
      },
      submit: function () {
        if (jsonParseErr(this.value)) {return;}
        app.show_tabpane('insert-cf-params');
        app.loading = true;
      },
    },
    filters: {
      jsonParseErr: jsonParseErr,
    },
    created: function () {
      this.$set('selected_cft_id', null);
    }
  });

  Vue.component("insert-cf-params", {
    template: '#insert-cf-params-template',
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
    },
    created: function () {
      var self = this;
      var cft = new CFTemplate(current_infra);
      cft.insert_cf_params(this.$parent.current_infra.add_modify).done(function (data) {
        self.$set('params', data);
        self.$set('result', {});
        _.each(data, function (val, key) {
          self.result.$add(key, val.Default);
        });
        self.$set('loading', false);
        app.loading = false;
      });
    },
  });

  Vue.component('add-ec2-tabpane', {
    template: '#add-ec2-tabpane-template',
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
    computed: {},
    created: function () {
      this.$set('physical_id', '');
      this.$set('screen_name', '');
    }
  });

  Vue.component("cf-history-tabpane", {
    template: '#cf-history-tabpane-template',
    methods: {
      active: function (id) {
        return this.id === id;
      },
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
      currentExists: function () {
        return !_.isEmpty(this.current);
      },
    },
    created: function () {
      this.$set('id', -1);
      this.$set('current', {});
    },
  });

  Vue.component("infra-logs-tabpane", {
    template: '#infra-logs-tabpane-template',
    methods: {
      status_class: function (status) {
        return status ? 'label-success' : 'label-danger';
      },
      status_text: function (status) {
        return status ? 'SUCCESSED' : 'FAILED';
      },
    },
    created: function () {
      this.$watch('infra_logs', function (newVal, oldVal) {
        $(".popovermore").popover().click( function(e) {
          e.preventDefault();
        });
      });

      this.$on('show', function (page) {
        var self = this;
        current_infra.logs(page).done(function (data) {
          self.infra_logs = data;
        }).fail(alert_and_show_infra);
      });
    },
  });

  // TODO: .active をつける
  Vue.component("monitoring-tabpane", {
    template: "#monitoring-tabpane-template",
    methods: {
      show_problems: function () {
        var self = this;
        this.monitoring.show_problems().done(function (data) {
          self.problems = data;
          self.loading_problems = false;
        });
      },
      create: function () {
        var self = this;
        self.creating = true;
        this.monitoring.create_host().done(function () {
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
          self.loading_graph = false;
          Vue.nextTick(function () {
            self.drawChart(data, physical_id, 'NetworkInOut', ['NetworkIn', 'NetworkOut', 'Sum']);
          });
        }).fail(alert_and_show_infra);
      },
    },
    computed: {
      monitoring: function () {
        return new Monitoring(current_infra);
      },
      no_problem: function () {
        return _.isEmpty(this.problems);
      },
      before_setting: function() {
        return this.commons.length === 0 && this.uncommons.length === 0;
      }
    },
    created: function () {
      var self = this;
      self.$set('problems', null);
      self.$set('creating', false);
      var monitoring = new Monitoring(current_infra);
      monitoring.show().done(function (data) {
        self.$set('before_register', data.before_register);
        self.$set('commons', data.monitor_selected_common);
        self.$set('uncommons', data.monitor_selected_uncommon);
        self.$set('resources', data.resources);
        if (!this.before_register) {
          self.$set('error_message', null);
          self.$set('loading_graph', false);
          self.$set('url_status', []);
          self.$set('showing_url', false);
          self.$set('loading_problems', true);
          self.show_problems();
        }
        self.$parent.loading = false;
      });
    },
  });

  Vue.component("edit-monitoring-tabpane", {
    template: "#edit-monitoring-tabpane-template",
    methods: {
      type: function (master) {
        return this.monitoring.type(master);
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
    },
    computed: {
      monitoring: function () {
        return new Monitoring(current_infra);
      },
    },
    created: function () {
      var self = this;
      this.monitoring.edit().done(function (data) {
        self.$set("master_monitorings",      data.master_monitorings);
        self.$set("selected_monitoring_ids", data.selected_monitoring_ids);
        self.$set("web_scenarios",           data.web_scenarios);
        self.$set("mysql_rds_host",          null);
        self.$set("postgresql_rds_host",     null);

        self.$set('add_scenario', {});
        self.$set('loading', false);

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
    template: '#vue-paginator-template',
    methods: {
      isDisable: function (i) {
        if (this.current <= i) {
          return this.current === this.max;
        } else {
          return this.current === 1;
        }
      },
      visibleTruncate: function (type) {
        if (type === 'next') {
          return this.current + 4 < this.max ;
        } else { // 'prev'
          return 0 < this.current - 5;
        }
      },
      show: function (page) {
        if (this.isDisable(page)){return;}

        this.$dispatch('show', page);
      },
    },
    filters: {
      visibleNum: function (array) {
        var self = this;
        return _.filter(array, function (n) {
          var i = n + self.current - 4;
          return 0 < i && i <= self.max;
        });
      },
    }
  });

  Vue.component('rds-tabpane', {
    template: '#rds-tabpane-template',
    methods: {
      change_scale: function () {
        var rds = new RDSInstance(current_infra, this.physical_id);
        rds.change_scale(this.change_scale_type_to).done(function (msg) {
          alert_success(self.reload)(msg);
          $('#change-scale-modal').modal().hide();
        }).fail(function (msg) {
          alert_danger(self.reload)(msg);
          $('#change-scale-modal').modal().hide();
        });
      },
      gen_serverspec: function () {
        var self = this;
        var rds = new RDSInstance(current_infra, this.physical_id);
        rds.gen_serverspec(this.serverspec).done(function (msg) {
          alert_success(self.reload)(msg);
          $('#rds-serverspec-modal').modal().hide();
        }).fail(function (msg) {
          alert_danger(self.reload)(msg);
          $('#rds-serverspec-modal').modal().hide();
        });
      },
      reload: function () {
        this.$parent.show_rds(this.physical_id);
      },
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
        self.$set('rds', data.rds);
        self.$parent.loading = false;
        self.$set('serverspec', {});
      }).fail(alert_and_show_infra);
    },
  });

  // this.physical_id is a elb_name.
  Vue.component('elb-tabpane', {
    template: '#elb-tabpane-template',
    methods: {
      show_ec2: function (physical_id) {
        this.$parent.show_ec2(physical_id);
      },
      deregister: function (physical_id) {
        // TODO: confirm
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
      state: function (state){
        if (state === 'InService') {
          return 'success';
        }
        return 'danger';
      },
    },
    compiled: function () {
      var self = this;
      current_infra.show_elb(this.physical_id).done(function (data) {
        self.$set('ec2_instances', data.ec2_instances);
        self.$set('unregistereds', data.unregistereds);
        self.$set('dns_name', data.dns_name);
        self.$set('selected_ec2', null);
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
  });

  Vue.component('s3-tabpane', {
    template: '#s3-tabpane-template',
    compiled: function () {
      var self = this;
      var s3 = new S3Bucket(current_infra, this.physical_id);
      s3.show().done(function (res) {
        self.$set('html', res);
        self.$parent.loading = false;
      }).fail(alert_and_show_infra);
    },
  });

  Vue.component('ec2-tabpane', {
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

        var dfd = ec2[method_name](params).fail(
          // cook start fail
          alert_danger(self._show_ec2)
        ).progress(function (state, msg) {
          // cook start success
          if(state !== 'start'){return;}

          alert_success(function () {
            self.inprogress = true;
          })(msg);
        });
        self.watch_cook(dfd);
      },
      watch_cook: function (dfd) {
        var self = this;
        var infra_id = current_infra.id;
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
          Vue.nextTick(function () {
            var el = document.getElementById("cook-status");
            el.scrollTop = el.scrollHeight;
          });
        });
      },
      apply_dish: function () {
        this._cook('apply_dish', this.selected_dish);
      },
      cook: function () {
        this._cook('cook');
      },
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
            })(msg);
          });
          self.watch_cook(dfd);
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
      _show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
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
      is_role: function (run) {
        return run.indexOf("role") !== -1;
      },
      runlist_type: function (run) {
        return run.replace(/\[.+\]$/, "");
      },
      runlist_name: function (run) {
        return run.replace(/^.+\[(.+)\]$/, "$1");
      },
      _loading: function () {
        // show loading tabpane
        this.$parent.loading = true;
      },
      change_scale: function () {
        var self = this;
        self.loading = true;
        var ec2 = new EC2Instance(current_infra, self.physical_id);
        ec2.change_scale(self.change_scale_type_to).done(function (msg) {
          alert_success(self._show_ec2)(msg);
          $('#change-scale-modal').modal().hide();
        }).fail(function (msg) {
          alert_danger(self._show_ec2)(msg);
          $('#change-scale-modal').modal().hide();
        });
      },
    },
    computed: {
      ec2_btn_class: function () {
        if (this.running) {
          return 'btn-success';
        }
        return 'btn-default';
      },
      cook_status_class: function () {
        var s = this.ec2.info.cook_status;
        return this._label_class(s);
      },
      serverspec_status_class: function () {
        var s = this.ec2.info.serverspec_status;
        return this._label_class(s);
      },
      update_status_class: function () {
        var s = this.ec2.info.update_status;
        return this._label_class(s);
      },
      cook_status: function () {
        return this.ec2.info.cook_status;
      },
      serverspec_status: function () {
        return this.ec2.info.serverspec_status;
      },
      update_status: function () {
        return this.ec2.info.update_status;
      },
      runlist_empty: function () {
        return _.isEmpty(this.ec2.runlist);
      },
      dishes_empty: function () {
        return _.isEmpty(this.ec2.dishes);
      },
      running: function () {
        return this.ec2.status === 'running';
      },
      stopped: function () {
        return this.ec2.status === 'stopped';
      }
    },
    filters: {
    },
    created: function () {
      this.$set('loading', false);
      this.$set('inprogress', false); // for cook
      this.$set('ec2_status_changing', false);
      this.$set('chef_console_text', '');
    },
    ready: function () {
      var self = this;

      var ec2 = new EC2Instance(current_infra, this.physical_id);
      ec2.show().done(function (data) {
        self.$set('ec2', data);

        var dish_id = null;
        if (self.ec2.selected_dish) {
          dish_id = self.ec2.selected_dish.id;
        }
        self.$set('selected_dish', dish_id);

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
    },
  });

  Vue.component('edit-runlist-tabpane', {
    template: '#edit-runlist-tabpane-template',
    methods: {
      get_recipes: function () {
        var self = this;
        if (self.recipes[self.selected_cookbook]) {
          return;
        }
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
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
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
        if (_.include(this.runlist, run)) {
          return;
        }
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
      current_recipes: function () {
        return this.recipes[this.selected_cookbook] || [];
      },
      physical_id: function () {
        return this.$parent.tabpaneGroupID;
      },
      ec2: function () {
        return new EC2Instance(current_infra, this.physical_id);
      },
    },
    created: function () {
      var self = this;
      self.$set('recipes', {});
      self.$set('selected_cookbook', null);
      self.$set('selected_recipes',  null);
      self.$set('selected_roles',    null);
      self.$set('selected_runlist',  null);
      self.$set('loading', false);

      self.ec2.edit().done(function (data) {
        self.$set('runlist',   data.runlist);
        self.$set('cookbooks', data.cookbooks);
        self.$set('roles',     data.roles);
        self.$parent.loading = false;
      }).fail(alert_danger(self.show_ec2));
    }
  });

  Vue.component("edit-attr-tabpane", {
    template: '#edit-attr-tabpane-template',
    methods: {
      update: function () {
        var self = this;
        self.loading = true;
        self.ec2.update_attributes(self.attributes)
          .done(alert_success(self.show_ec2))
          .fail(alert_danger(self.show_ec2));
      },
      show_ec2: function () {
        this.$parent.show_ec2(this.physical_id);
      },
    },
    filters: {
      toID: function (name) {
        return name.replace(/\//g, '-');
      },
    },
    computed: {
      physical_id: function () {
        return this.$parent.tabpaneGroupID;
      },
      ec2: function () {
        return new EC2Instance(current_infra, this.physical_id);
      },
      empty: function () {
        return _.isEmpty(this.attributes);
      },
    },
    created: function () {
      var self = this;
      self.ec2.edit_attributes().done(function (data) {
        self.$set('attributes', data);
        self.$set('loading', false);
        self.$parent.loading = false;
      }).fail(alert_danger(self.show_ec2));
    },
  });

  Vue.component('serverspec-tabpane', {
    template: '#serverspec-tabpane-template',
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
    },
    computed: {
      physical_id: function () {
        return this.$parent.tabpaneGroupID;
      },
      ec2: function () {
        return new EC2Instance(current_infra, this.physical_id);
      },
      all_spec: function () {
        return this.globals.concat(this.individuals);
      },
      can_run: function () {
        return !!_.find(this.all_spec, function(s){return s.checked;}) || this.checked_auto_generated;
      },
    },
    created: function () {
      var self = this;
      self.ec2.select_serverspec().done(function (data) {
        self.$set('available_auto_generated', data.available_auto_generated);
        self.$set('individuals', data.individuals || []);
        self.$set('globals', data.globals || []);
        self.$set('loading', false);
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
          add_modify: null,
          insert_cf_params: {},
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
            self.$set('current_infra.add_modify', {});
            self.$set('current_infra.add_modify.histories', data.histories);
            self.$set('current_infra.add_modify.globals', data.globals);

            self.show_tabpane('add_modify');
          }).fail(alert_danger());
        },
        show_add_ec2: function () {
          this.show_tabpane('add-ec2');
        },
        show_cf_history: function () {
          var self = this;
          self.loading = true;
          self.$event.preventDefault();

          var cft = new CFTemplate(current_infra);
          cft.history().done(function (data) {
            self.current_infra.cf_history = data;
            self.show_tabpane('cf_history');
          }).fail(alert_and_show_infra);
        },
        show_event_logs: function () {
          if (this.no_stack()) {return;}
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
          self.loading = true;
          self.$event.preventDefault();
          current_infra.logs().done(function (data) {
            self.current_infra.infra_logs = data;
            self.show_tabpane('infra_logs');
          }).fail(alert_and_show_infra);
        },
        show_monitoring: function () {
          if (this.no_stack()) {return;}
          var self = this;
          self.show_tabpane('monitoring');
          self.loading = true;
        },
        show_edit_monitoring: function () {
          if (this.no_stack()) {return;}
          var self = this;
          self.show_tabpane('edit-monitoring');
          self.loading = true;
        },
        no_stack: function () {
          return this.current_infra.stack.status.type === 'NONE';
        },
        in_progress: function () {
          return this.current_infra.stack.status.type === 'IN_PROGRESS';
        },
        stack_fail: function () {
          return this.current_infra.stack.status.type === 'NG';
        },
        tabpane_active: function (id) {
          return this.tabpaneID === id;
        },
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
        toLocaleString: function (datetext) {
          var date = new Date(datetext);
          return date.toLocaleString();
        }
      },
      ready: function () {
        var self = this;
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
      }).fail(function (msg) {
        bootstrap_alert(t('infrastructures.infrastructure'), msg, 'danger');
      }).always(l.$destroy);
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
      }).fail(function (msg) {
        bootstrap_alert(t('infrastructures.infrastructure'), msg, 'danger').done(function () {
          show_infra(infra_id);
        });
      }).always(l.$destroy);
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




// ================================================================
// event bindings
// ================================================================


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
