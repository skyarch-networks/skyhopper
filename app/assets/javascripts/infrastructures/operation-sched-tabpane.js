var Infrastructure = require('models/infrastructure').default;
var Resource       = require('models/resource').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_and_show_infra = helpers.alert_and_show_infra;

var wrap = require('modules/wrap');
var listen = require('modules/listen');

var queryString = require('query-string').parse(location.search);

module.exports = Vue.extend({
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
      }).fail(alert_and_show_infra(infra.id));
    },

    get_sched: function (ec2){
      var self = this;
      self.$parent.show_operation_sched();
      var infra = new Infrastructure(this.infra_id);
      infra.get_schedule(ec2.physical_id).done(function  (data){
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
        if (data.length > 0){
          self.render_calendar(data, events);
        }

      });
    },

    render_calendar: function (data, events) {
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
    },
    check_length: function (argument) {
      if (argument) {
        return (argument.length >= 10);
      }
    }

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
    this.$parent.loading = false;
  }
});
