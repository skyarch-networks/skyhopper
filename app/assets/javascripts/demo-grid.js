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
        case 'dishes':
          self.$parent.show_dish(item.id);
          break;
      }

    },

    load_ajax: function (request, empty_msg) {
      var self = this;

      $.ajax({
        cache: false,
        url: request,
        success: function (data) {
          console.log(data);
          self.data = data;
          this.pages = data.length;
          self.close_loading(empty_msg);
        }
      });

    },

    close_loading: function(empty_msg){
      var self = this;
      self.$emit('data-loaded');
      $("#loading").hide();
      if(self.data.length === 0){ $('#empty').show().html(empty_msg);}
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
    var id =  queryString.project_id;
    var self = this;

    switch (self.index) {
      case 'clients':
        self.load_ajax('clients?lang='+self.lang, t('clients.msg.empty-list'));
        break;
      case 'projects':
        self.load_ajax(self.projects_path ,t('projects.msg.empty-list'));
        break;
      case 'infrastructures':
        self.load_ajax(self.infrastructures_path, t('infrastructures.msg.empty-list'));
        break;
      case 'dishes':
        project_id = id ? '&project_id='+id: '';
        self.load_ajax('dishes?lang='+self.lang+project_id, t('dishes.msg.empty-list'));

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
