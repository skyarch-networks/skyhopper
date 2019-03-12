var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;
var queryString = require('query-string').parse(location.search);

var wrap = require('modules/wrap');
var listen = require('modules/listen');

var helpers = require('infrastructures/helper.js');
var alert_danger         = helpers.alert_danger;

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

  data: function () {
    var sortOrders = {};
    this.columns.forEach(function (key) {
      sortOrders[key] = 1;
    });
    return {
      sortKey: '',
      sortOrders: sortOrders,
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

  methods:{
    show_ec2: function () {
      this.$parent.show_ec2(this.physical_id);
    },
    sortBy: function (key) {
      if(key !== 'id') {
        this.sortKey = key;
        this.sortOrders[key] = this.sortOrders[key] * -1;
      }
    },
    showPrev: function(){
      if(this.pageNumber === 0) return;
      this.pageNumber--;
    },
    showNext: function(){
      if(this.isEndPage) return;
      this.pageNumber++;
    },
    coltxt_key: function(key){
      index = this.index;
      return wrap(key,index);
    },
    table_text: function(value,key,lang){
      index = this.index;
      return listen(value,key,index,lang);
    },

  },

  computed: {
    physical_id: function () { return this.$parent.tabpaneGroupID; },
    ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    all_spec:    function () { return this.globals.concat(this.individuals); },

    servertest_filter: function(){
      var self = this;
      var data = self.data.filter(function (data) {
        if(self.filterKey === ""){
          return true
        } else {
          return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
        }
      });
      Vue.set(self, 'filteredLength', data.length);
      data = data.sort(function (data) {
        return data[self.sortKey];
      });
      if(self.sortOrders[self.sortKey] === -1){
        data.reverse();
      }
      var index = self.pageNumber * self.pages;
      return data.slice(index, index + self.pages);
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
  created: function ()  {
    var self = this;
    self.ec2.results_servertest().done(function (data) {
      self.data = data.map(function (item) {
        var last_log = (item.created_at ? new Date(item.created_at) : '');
          return {
            servertest: {
              servertests: item.servertests,
              auto_generated: item.auto_generated_servertest
            },
            resource: item.resource.physical_id,
            message: {
              id: item.id,
              physical_id: item.resource.physical_id,
              message: item.message,
              servertest_result_details: item.servertest_result_details,
              auto_generated_servertest: item.auto_generated_servertest
            },
            status: item.status,
            created_at: last_log.toLocaleString(),
            category: item.servertests,
          };
      });
      self.$parent.loading = false;
      if(self.data.length === 0){ self.is_empty = true; }
    }).fail(alert_danger(self.show_ec2));
  },
});
