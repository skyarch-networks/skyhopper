var wrap = require('modules/wrap');
var listen = require('modules/listen');
var queryString = require('query-string').parse(location.search);

// register the grid component
module.exports = Vue.extend({
  template: '#grid-template',
  replace: true,
  props: {
    data: Array,
    columns: Array,
    filterKey: String,
    picked: Object,
    index: String,
    multiSelect: Boolean,
    selections: Array,
    url:  String,
    empty: String,
  },

  data: function () {
    var sortOrders = {};
    if(this.columns){
        this.columns.forEach(function (key) {
            sortOrders[key] = 1;
        });
    }
    return {
      sortKey: '',
      sortOrders: sortOrders,
      loading: true,
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
    pop: function(){
       $('#role').popover('toggle');
    },
    showPrev: function(){
      if(this.pageNumber === 0) return;
      this.pageNumber--;
    },

    showNext: function(){
      if(this.isEndPage) return;
      this.pageNumber++;
    },
    select_entry: function(item)  {
      this.picked = item;
      if (this.multiSelect) {
        if (this.selections.includes(item)) {
          this.selections.$remove(item);
        } else {
          this.selections.push(item);
        }
      }
    },
    show_entry: function(item){
      var self = this;
      switch (self.index) {
        case 'clients':
          window.location.assign(item.projects_path);
          break;
        case 'projects':
          window.location.assign(item.infrastructures_path);
          break;
        case 'infrastructures':
          self.$parent.show_infra(item.id);
          break;
        case 'dishes':
          self.$parent.show_dish(item.id);
          break;
        case  'serverspecs':
          self.$parent.show_serverspec(item.id);
          break;
        case  'cf_templates':
          self.$parent.show_template(item.id);
          break;
        case  'user_admin':
          break;


      }

    },

    load_ajax: function (request) {
      var self = this;
      $.ajax({
        cache: false,
        url: request,
        success: function (data) {
          self.data = data;
          this.pages = data.length;
          self.close_loading();
        }
      });

    },

    close_loading: function(){
      var self = this;
      self.$parent.loading = false;
      if(self.data.length === 0){
        self.$parent.is_empty = true;
      }
      self.filteredLength = self.data.length;
    }
  },

  computed: {
    isStartPage: function(){
      return (this.pageNumber === 0);
    },
    isEndPage: function(){
      return ((this.pageNumber + 1) * this.pages >= this.data.length);
    },
    isFilteredLength: function () {
      return (this.filteredLength === 0 && this.data === null && this.data === '');
    },
    isPaginated: function () {
        if (this.data)
            return this.data.length >= 10 && this.filteredLength >= 10;
        else
            return false;
    }
  },
  ready: function (){
    var self = this;
    self.load_ajax(self.url);
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
  },
});
