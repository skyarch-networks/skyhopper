const queryString = require('query-string').parse(window.location.search);
const Infrastructure = require('../models/infrastructure').default;

const helpers = require('../infrastructures/helper.js');

const alertSuccess = helpers.alert_success;
const alertAndShowInfra = helpers.alert_and_show_infra;

const wrap = require('../modules/wrap');
const listen = require('../modules/listen');


module.exports = Vue.extend({
  template: '#operation-sched-tabpane-template',
  replace: true,

  props: {
    columns: Array,
    infra_id: {
      type: Number,
      required: true,
    },
    resources: {},
  },

  data() {
    const sortOrders = {};
    this.columns.forEach((key) => {
      sortOrders[key] = 1;
    });
    return {
      event_loading: false,
      instances: null,
      dates: [{ day: t('operation_scheduler.dates.monday'), checked: false, value: 1 },
        { day: t('operation_scheduler.dates.tuesday'), checked: false, value: 2 },
        { day: t('operation_scheduler.dates.wednesday'), checked: false, value: 3 },
        { day: t('operation_scheduler.dates.thursday'), checked: false, value: 4 },
        { day: t('operation_scheduler.dates.friday'), checked: false, value: 5 },
        { day: t('operation_scheduler.dates.saturday'), checked: false, value: 6 },
        { day: t('operation_scheduler.dates.sunday'), checked: false, value: 0 }],
      default_start: moment().utcOffset('Asia/Tokyo').startOf('day').hour(7)
        .minute(0)
        .format('YYYY/MM/D H:mm'),
      default_end: moment().utcOffset('Asia/Tokyo').startOf('day').add(1, 'years')
        .hour(19)
        .minute(0)
        .format('YYYY/MM/D H:mm'),
      time_start: moment().utcOffset('Asia/Tokyo').startOf('day').hour(7)
        .minute(0)
        .format('H:mm'),
      time_end: moment().utcOffset('Asia/Tokyo').startOf('day').hour(19)
        .minute(0)
        .format('H:mm'),
      modes: [{ desc: t('operation_scheduler.desc.everyday'), value: 1 },
        { desc: t('operation_scheduler.desc.weekdays'), value: 2 },
        { desc: t('operation_scheduler.desc.weekends'), value: 3 },
        { desc: t('operation_scheduler.desc.specific_dates'), value: 4 }],
      sel_instance: {
        start_date: null,
        end_date: null,
        start_time: null,
        end_time: null,
        repeat_freq: null,
      },
      sources: [],
      filterKey: '',
      sortKey: '',
      sortOrders,
      index: 'operation_sched',
      lang: null,
      pages: 10,
      pageNumber: 0,
      data: [],
      message: '',
    };
  },

  methods: {
    show_ec2() {
      this.$parent.show_ec2(this.physical_id);
    },

    sortBy(key) {
      if (key !== 'id') this.sortKey = key;
      this.reversed[key] = !this.reversed[key];
    },

    showPrev() {
      if (this.pageNumber === 0) return;
      this.pageNumber = -1;
    },

    showNext() {
      if (this.isEndPage) return;
      this.pageNumber = +1;
    },

    repeat_selector() {
      if (parseInt(this.sel_instance.repeat_freq, 0) === 1) {
        $('#days-selector').hide();
        this.dates.forEach((item) => {
          item.checked = true;
        });
      } else if (parseInt(this.sel_instance.repeat_freq, 0) === 2) {
        $('#days-selector').hide();
        this.dates.forEach((item) => {
          item.checked = !(parseInt(item.value, 0) === 6 || parseInt(item.value, 0) === 0);
        });
      } else if (parseInt(this.sel_instance.repeat_freq, 0) === 3) {
        $('#days-selector').hide();
        this.dates.forEach((item) => {
          item.checked = (parseInt(item.value, 0) === 6 || parseInt(item.value, 0) === 0);
        });
      } else {
        this.dates.forEach((item) => {
          item.checked = false;
          $('#days-selector input').attr('disabled', false);
          $('#days-selector').show();
        });
      }
    },

    set_default_start_sched() {
      Vue.set(this.sel_instance, 'start_date', this.default_start);
      $('#op-sched-start').val(this.default_start);
    },

    set_default_end_sched() {
      Vue.set(this.sel_instance, 'end_date', this.default_end);
      $('#op-sched-end').val(this.default_end);
    },

    pop(e) {
      if (e === 'duration') {
        $('#duration').popover('toggle');
      } else if (e === 'recurring') {
        $('#recurring').popover('toggle');
      }
    },

    manage_sched(instance) {
      const self = this;
      self.sel_instance = instance;
      const infra = new Infrastructure(this.infra_id);
      infra.get_schedule(instance.physical_id).done(() => {
        self.sel_instance.physical_id = instance.physical_id;
      });
    },

    save_sched() {
      const self = this;
      self.$parent.loading = true;
      const submitSelInstance = Object.assign({}, self.sel_instance);
      submitSelInstance.dates = self.dates;
      submitSelInstance.start_date = moment(self.sel_instance.start_date).unix();
      submitSelInstance.end_date = moment(self.sel_instance.end_date).unix();
      const infra = new Infrastructure(this.infra_id);
      infra.save_schedule(self.sel_instance.physical_id, submitSelInstance).done(() => {
        self.loading = false;
        alertSuccess(() => {
        })(t('operation_scheduler.msg.saved'));
        self.get_sched(self.sel_instance);
      }).fail(alertAndShowInfra(infra.id));
    },

    get_sched(ec2) {
      const self = this;
      self.$parent.show_operation_sched(self.resources);
      const infra = new Infrastructure(this.infra_id);
      infra.get_schedule(ec2.physical_id).done((data) => {
        let events = [];
        events = data.map((item) => {
          let dow = [];
          if (item.recurring_date.repeats === 'other') {
            item.recurring_date.dates.forEach((date) => {
              if (date.checked === 'true') dow.push(parseInt(date.value, 0));
            });
          } else if (item.recurring_date.repeats === 'everyday') {
            dow = [1, 2, 3, 4, 5, 6, 0];
          } else if (item.recurring_date.repeats === 'weekdays') {
            dow = [1, 2, 3, 4, 5];
          } else {
            dow = [0, 6];
          }
          return {
            title: item.resource.physical_id,
            start: moment(item.recurring_date.start_time).utcOffset('+0000').format('HH:mm'),
            end: moment(item.recurring_date.end_time).utcOffset('+0000').format('HH:mm'),
            dow,
          };
        });
        if (data.length > 0) {
          self.render_calendar(data, events);
        }
      });
    },

    render_calendar(data, events) {
      $('#calendar').fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay,agendaFourDay',
        },
        defaultView: 'agendaWeek',
        events,
        allDayDefault: false,
        lang: queryString.lang,
        viewRender(currentView) {
          const minDate = moment(data[0].start_date).utcOffset('Asia/Tokyo');


          const maxDate = moment(data[0].end_date).utcOffset('Asia/Tokyo');

          if (minDate >= currentView.start && minDate <= currentView.end) {
            $('.fc-prev-button').prop('disabled', true);
            $('.fc-prev-button').addClass('fc-state-disabled');
          } else {
            $('.fc-prev-button').removeClass('fc-state-disabled');
            $('.fc-prev-button').prop('disabled', false);
          }
          // Future
          if (maxDate >= currentView.start && maxDate <= currentView.end) {
            $('.fc-next-button').prop('disabled', true);
            $('.fc-next-button').addClass('fc-state-disabled');
          } else {
            $('.fc-next-button').removeClass('fc-state-disabled');
            $('.fc-next-button').prop('disabled', false);
          }
        },
      });
    },
    check_length(argument) {
      if (argument) {
        return (argument.length >= 10);
      }
      return undefined;
    },
    coltxt_key(key) {
      const [index] = this.$parent.index;
      return wrap(key, index);
    },

    table_text(value, key, lang) {
      const [index] = this.$parent.index;
      return listen(value, key, index, lang);
    },

  },

  computed: {
    has_selected() {
      return this.dates.some(c => c.checked);
    },

    operation_filter() {
      const self = this;
      let data = self.data.filter(() => {
        if (self.filterKey === '') {
          return true;
        }
        return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
      });
      self.filteredLength = data.length;
      data = data.sort(() => data[self.sortKey]);
      if (self.sortOrders[self.sortKey] === -1) {
        data.reverse();
      }
      const index = self.pageNumber * self.pages;
      return data.slice(index, index + self.pages);
    },

    is_specific() {
      return (parseInt(this.sel_instance.repeat_freq, 0) === 4);
    },

    save_sched_err() {
      const self = this.sel_instance;
      return (self.start_date && self.end_date && self.repeat_freq);
    },

    isStartPage() { return (this.pageNumber === 0); },
    isEndPage() { return ((this.pageNumber + 1) * this.pages >= this.data.length); },
  },

  filters: {
    wrap,
    listen,
    paginate(list) {
      const index = this.pageNumber * this.pages;
      return list.slice(index, index + this.pages);
    },
    roundup(val) { return (Math.ceil(val)); },
  },

  mounted() {
    this.$nextTick(() => {
      const self = this;
      // TODO: get all assigned dates and print to calendar. :D
      self.data = self.resources.ec2_instances.map(item => ({
        physical_id: item.physical_id,
        screen_name: item.screen_name,
        id: item,
      }));

      self.$parent.loading = false;
      $('#loading_results').hide();
      const empty = t('servertests.msg.empty-results');
      if (self.data.length === 0) {
        $('#empty_results').show().html(empty);
      }
    });
  },
});
