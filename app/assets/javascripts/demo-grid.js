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
    index: String
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
      picked: null,
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
    select_entry: function(item)  {
      this.$parent.picked = item;
      this.picked = item;
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
      }

    },
    fetch_clients: function()  {
      var self = this;
      self.loading = true;
      var id =  queryString.client_id;

     $.ajax({
         cache: false,
         url:'clients?lang='+self.lang,
         success: function (data) {
           self.data = data;
           this.pages = data.length;
           self.close_loading();
         }
       });

    },
    fetch_projects: function()  {
      var self = this;
      self.loading = true;
      var id =  queryString.client_id;
      $.ajax({
         cache: false,
         url:'projects?client_id='+id+'&lang='+self.lang,
         success: function (data) {
           self.data = data;
           this.pages = data.length;
           self.close_loading();
         }
       });
    },

    fetch_infras: function(){
      var self = this;
      var id =  queryString.project_id;

      $.ajax({
        cache: false,
        url:'/infrastructures?&project_id='+id,
        success: function (data) {
          console.log(data);
          self.data = data;
          this.pages = data.length;
          self.close_loading();
        }
      });
    },

    close_loading: function(){
      var self = this;
      self.$emit('data-loaded');
      $("#loading").hide();
      var empty = t('infrastructures.msg.empty-list');
      if(self.data.length === 0){ $('#empty').show().html(empty);}
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
  },
  created: function (){
    var self = this;
    switch (self.index) {
      case 'clients':
        self.fetch_clients();
        break;
      case 'projects':
        self.fetch_projects();
        break;
      case 'infrastructures':
        self.fetch_infras();
        break;
    }

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
