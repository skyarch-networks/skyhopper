//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
//= require serverspec-gen/ast
//= require serverspec-gen/ui
//browserify functions for vue filters functionality
var wrap = require('./modules/wrap');
var listen = require('./modules/listen');
var parseURLParams = require('./modules/getURL');
var serverspecIndex = require('./modules/loadindex');

var app;

Vue.component('demo-grid', {
  template: '#grid-template',
  replace: true,
  props: ['data', 'columns', 'filter-key'],
  data: function () {
    return {
      data: null,
      columns: null,
      sortKey: '',
      filterKey: '',
      reversed: {},
      option: ['serverspec'],
      lang: null,
      pages: 10,
      pageNumber: 0,
        };
    },
  compiled: function () {
    // initialize reverse state
      var self = this;
      this.columns.forEach(function (key) {
          self.reversed.$add(key, false);
       });
  },
  methods: {
    sortBy: function (key) {
        if(key !== 'id')
          this.sortKey = key;
          this.reversed[key] = !this.reversed[key];
    },
    parseURLParams: parseURLParams,
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
      self.lang = this.parseURLParams('lang');
      self.columns = ['name','description', 'id'];

     $.ajax({
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


$(document).ready(function(){
  serverspecIndex();
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
