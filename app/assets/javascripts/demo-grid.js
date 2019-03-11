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
    this.columns.forEach(function (key) {
      sortOrders[key] = 1;
    });
    return {
      sortKey: '',
      sortOrders: sortOrders,
      loading: true,
      lang: queryString.lang,
      pages: 10,
      pageNumber: 0,
      filteredLength: null,
      tbl_data: [],
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
      this.$parent.picked = item;
      if (this.multiSelect) {
        if (this.selections.includes(item)) {
          var index = this.selections.indexOf(item);
          this.selections.splice(index,1);
        } else {
          this.selections.push(item);
        }
      }
      this.$emit('can_edit');
    },
    show_entry: function(item){
      var self = this;
      switch (self.$parent.index) {
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

    coltxt_key: function(key){
      index = this.$parent.index;
      return wrap(key,index);
    },

    table_text: function(value,key,lang){
       index = this.$parent.index;
       return listen(value,key,index,lang);
    },


    load_ajax: function (request) {
      var self = this;
      console.log(request);
      $.ajax({
        cache: false,
        url: request,
        success: function (data) {
          self.tbl_data = data;
          this.pages = data.length;
          self.close_loading();
        }
      });

    },

    close_loading: function(){
      var self = this;
      self.$parent.loading = false;
      if(self.tbl_data.length === 0){
        self.$parent.is_empty = true;
      }
      self.filteredLength = self.tbl_data.length;
    }
  },

  computed: {
    isStartPage: function(){
      return (this.pageNumber === 0);
    },
    isEndPage: function(){
      return ((this.pageNumber + 1) * this.pages >= this.tbl_data.length);
    },
    table_data: function(){
      var self = this;
      var data_tbl = self.tbl_data.filter(function (data) {
        if(self.filterKey === ""){
          return true
        } else {
          return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
        }
      });
      self.$parent.gridData = data_tbl;
      Vue.set(self, 'filteredLength', data_tbl.length);
      data_tbl = data_tbl.sort(function (data) {
        return data[self.sortKey];
      });
      if(self.sortOrders[self.sortKey] === -1){
        data_tbl.reverse();
      }
      var index = self.pageNumber * self.pages;
      return data_tbl.slice(index, index + self.pages);
    },
    max_pages: function(){
      return Math.ceil(this.filteredLength / this.pages);
    },
  },
  mounted: function (){
    this.$nextTick(function () {
      var self = this;
      console.log(self.url);
      self.load_ajax(self.url);
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
  },
});
