//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


(function () {
  'use strict';

  ZeroClipboard.config({swfPath: '/assets/ZeroClipboard.swf'});

// ================================================================
// infrastructures
// ================================================================

//browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  //var infraindex = require('./modules/loadindex');
  var queryString = require('query-string').parse(location.search);
  //browserify modules for Vue directives
  var Infrastructure = require('models/infrastructure').default;
  var EC2Instance    = require('models/ec2_instance').default;
  var Resource       = require('models/resource').default;
  var modal          = require('modal');

  Vue.use(require('./modules/datepicker'), queryString.lang);
  Vue.use(require('./modules/timepicker'), queryString.lang);

  var vace = require('vue-ace');
  require('brace/mode/json');
  require('brace/theme/github');
  Vue.use(vace, false, 'json', '25');

  var helpers = require('infrastructures/helper.js');
  var jsonParseErr         = helpers.jsonParseErr;
  var toLocaleString       = helpers.toLocaleString;
  var alert_success        = helpers.alert_success;
  var alert_danger         = helpers.alert_danger;
  var alert_and_show_infra = helpers.alert_and_show_infra;


  Vue.component('stack-events-table',      require('infrastructures/stack-events-table.js'));
  Vue.component('add-modify-tabpane',      require('infrastructures/add-modify-tabpane.js'));
  Vue.component('insert-cf-params',        require('infrastructures/insert-cf-params.js'));
  Vue.component('add-ec2-tabpane',         require('infrastructures/add-ec2-tabpane.js'));
  Vue.component('cf-history-tabpane',      require('infrastructures/cf-history-tabpane.js'));
  Vue.component('infra-logs-tabpane',      require('infrastructures/infra-logs-tabpane.js'));
  Vue.component('monitoring-tabpane',      require('infrastructures/monitoring-tabpane.js'));
  Vue.component('edit-monitoring-tabpane', require('infrastructures/edit-monitoring-tabpane.js'));
  Vue.component('rds-tabpane',             require('infrastructures/rds-tabpane.js'));
  Vue.component('elb-tabpane',             require('infrastructures/elb-tabpane.js'));
  Vue.component('s3-tabpane',              require('infrastructures/s3-tabpane.js'));
  Vue.component('view-rules-tabpane',      require('infrastructures/view-rules-tabpane.js'));
  Vue.component('security-groups-tabpane', require('infrastructures/security-groups-tabpane.js'));
  Vue.component('ec2-tabpane',             require('infrastructures/ec2-tabpane.js'));



  Vue.component('edit-runlist-tabpane', {
    template: '#edit-runlist-tabpane-template',

    props: {
      infra_id: {
        type: Number,
        required: true,
      },
    },

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
      ec2:             function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
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

    props: {
      infra_id: {
        type: Number,
        required: true,
      },
    },

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
      ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
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
      filterKey: String,
      infra_id: {
        type: Number,
        required: true,
      },
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
      ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
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

    props: {
      infra_id: {
        type: Number,
        required: true,
      },
    },

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
      ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
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
      filterKey: String,
      infra_id: {
        type: Number,
        required: true,
      },
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
        var infra = new Infrastructure(this.infra_id);
        infra.get_schedule(instance.physical_id).done(function  (data){
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
        var infra = new Infrastructure(this.infra_id);
        infra.save_schedule(self.sel_instance.physical_id, self.sel_instance).done(function () {
          self.loading = false;
          alert_success(function () {
          })(t('operation_scheduler.msg.saved'));
          self.get_sched(self.sel_instance);
        }).fail(alert_and_show_infra);
      },
      get_sched: function (ec2){
        var self = this;
        self.$parent.show_operation_sched();
        var infra = new Infrastructure(this.infra_id);
        infra.get_schedule(ec2.physical_id).done(function  (data){
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
      isStartPage: function(){ return (this.pageNumber === 0); },
      isEndPage: function(){ return ((this.pageNumber + 1) * this.pages >= this.data.length); },
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
      var infra = new Infrastructure(this.infra_id);
      var res = new Resource(infra);
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
      var monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      $.ajax({
        cache: false,
        url:'/infrastructures?&project_id='+id,
      }).done(function (data) {
        this.pages = data.length;
        var nextColumns = [];
        self.data = data.map(function (item) {
          var d = new Date(item.created_at);
          var date = monthNames[d.getUTCMonth()]+' '+d.getDate()+', '+d.getFullYear()+' at '+d.getHours()+':'+d.getMinutes();
          if(item.project_id > 3){
            return {
              stack_name: item.stack_name,
              region: item.region,
              keypairname: item.keypairname,
              created_at: date,
              //  ec2_private_key_id: item.ec2_private_key_id,
              status: item.status,
              id: [item.id,item.status],
            };
          }else{
            return {
              stack_name: item.stack_name,
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


  var show = require('infrastructures/show_infra.js');
  var show_infra = show.show_infra;
  var SHOW_INFRA_ID = show.SHOW_INFRA_ID;

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
    modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).then(function () {
      return modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name'));
    }).then(function (name) {
      if(!name){
        modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
        return;
      }

      var region_input = $('#infrastructure_region');
      var region = region_input.val();
      var project_id = $('#infrastructure_project_id').val();

      return $.ajax({
        url: '/ec2_private_keys',
        type: 'POST',
        data: {
          name:       name,
          region:     region,
          project_id: project_id,
        },
      });
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
    show_infra(infra_id, '');
  });

  $(document).on('click', '.operation-sched', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_infra(infra_id, 'show_sched');
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
