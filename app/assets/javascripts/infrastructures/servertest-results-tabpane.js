var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var wrap = require('modules/wrap');
var listen = require('modules/listen');

var helpers = require('infrastructures/helper.js');
var alert_danger         = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#servertest-results-tabpane-template',
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
      index: 'servertest_results',
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
  },

  computed: {
    physical_id: function () { return this.$parent.tabpaneGroupID; },
    ec2:         function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
    all_spec:    function () { return this.globals.concat(this.individuals); },

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
    self = this;
    var self = this;
    self.columns = ['servertest', 'resource', 'message', 'status', 'created_at', 'category'];
    var temp_id = null;
    var serverspecs = [];
    self.ec2.results_servertest().done(function (data) {
      self.data = data.map(function (item) {
        console.log(item)
        var last_log = (item.created_at ? new Date(item.created_at) : '');
          return {
            servertest: item.servertests,
            resource: item.resource.physical_id,
            message: [item.id,
                      item.resource.physical_id,
                      item.message,
                      item.servertest_result_details],
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
