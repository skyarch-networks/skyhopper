//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//browserify functions for vue filters functionality
var wrap = require('./modules/wrap');
var listen = require('./modules/listen');
var queryString = require('query-string').parse(location.search);

Vue.use(require('./modules/ace'), true, 'ruby');


require('serverspec-gen/ui');

var app;

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
      option: ['serverspec'],
      lang: queryString.lang,
      pages: 10,
      pageNumber: 0,
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
      var il = new Loader();
      var self = this;
      self.loading = true;
     $.ajax({
         cache: false,
         url:'serverspecs?lang='+self.lang,
         success: function (data) {
           this.pages = data.length;
           self.data = data.map(function (item) {
             return {
               name: item.name,
               code: item.description,
               id: item.id,
             };
           });
           self.$emit('data-loaded');
           var empty = t('projects.msg.empty-list');
           if(self.data.length === 0){ $('#empty').show().html(empty);}
         }
       });
       $("#loading").hide();
  },
  filters:{
    wrap: wrap,
    listen: listen,
    paginate: function(list) {
      var index = this.pageNumber * this.pages;
      return list.slice(index, index + this.pages);
    },
    roundup: function (val) { return (Math.ceil(val));},
  }
});

var serverspecIndex = new Vue({
  el: '#indexElement',
  data: {
    searchQuery: '',
    gridColumns: ['name','description', 'id'],
    gridData: []
  }
});

$(document).on("click", ".show-value", function(){
  var serverspec_id = $(this).closest("a").attr("data-serverspec-id");
  $.ajax({
    url : "/serverspecs/" + serverspec_id,
    type : "GET",
    success : function (data) {
      $("#value-information").html(data);
    }
  });
  document.getElementById('value').style.display='';
});
