const Infrastructure = require('models/infrastructure').default;
const EC2Instance = require('models/ec2_instance').default;
const queryString = require('query-string').parse(location.search);

const wrap = require('modules/wrap');
const listen = require('modules/listen');

const helpers = require('infrastructures/helper.js');

const alert_danger = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#servertest-results-tabpane-template',
  replace: true,

  props: {
    columns: Array,
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    const sortOrders = {};
    this.columns.forEach((key) => {
      sortOrders[key] = 1;
    });
    return {
      sortKey: '',
      sortOrders,
      index: 'servertest_results',
      lang: queryString.lang,
      pages: 10,
      pageNumber: 0,
      data: [],
      filteredLength: '',
      filterKey: '',
      message: '',
      loading: '',
    };
  },

  methods: {
    show_ec2() {
      this.$parent.show_ec2(this.physical_id);
    },
    sortBy(key) {
      if (key !== 'id') {
        this.sortKey = key;
        this.sortOrders[key] = this.sortOrders[key] * -1;
      }
    },
    showPrev() {
      if (this.pageNumber === 0) return;
      this.pageNumber--;
    },
    showNext() {
      if (this.isEndPage) return;
      this.pageNumber++;
    },
    coltxt_key(key) {
      index = this.index;
      return wrap(key, index);
    },
    table_text(value, key, lang) {
      index = this.index;
      return listen(value, key, index, lang);
    },

  },

  computed: {
    physical_id() { return this.$parent.tabpaneGroupID; },
    ec2() { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    all_spec() { return this.globals.concat(this.individuals); },

    servertest_filter() {
      const self = this;
      let data = self.data.filter((data) => {
        if (self.filterKey === '') {
          return true;
        }
        return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
      });
      self.filteredLength = data.length;
      data = data.sort(data => data[self.sortKey]);
      if (self.sortOrders[self.sortKey] === -1) {
        data.reverse();
      }
      const index = self.pageNumber * self.pages;
      return data.slice(index, index + self.pages);
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
  created() {
    const self = this;
    self.ec2.results_servertest().done((data) => {
      self.data = data.map((item) => {
        const last_log = (item.created_at ? new Date(item.created_at) : '');
        return {
          servertest: {
            servertests: item.servertests,
            auto_generated: item.auto_generated_servertest,
          },
          resource: item.resource.physical_id,
          message: {
            id: item.id,
            physical_id: item.resource.physical_id,
            message: item.message,
            servertest_result_details: item.servertest_result_details,
            auto_generated_servertest: item.auto_generated_servertest,
          },
          status: item.status,
          created_at: last_log.toLocaleString(),
          category: item.servertests,
        };
      });
      self.$parent.loading = false;
      if (self.data.length === 0) { self.is_empty = true; }
    }).fail(alert_danger(self.show_ec2));
  },
});
