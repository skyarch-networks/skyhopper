//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(function () {
  'use_strict';

  //browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  var md5 = require('md5');
  var queryString = require('query-string').parse(location.search);

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
        option: ['user_admin'],
        lang: queryString.lang,
        pages: 10,
        pageNumber: 0,
        filteredLength: null,
      };
    },
    methods: {
      sortBy: function (key) {
          if(key !== 'id' && key !== 'role'){
            this.sortKey = key;
            this.sortOrders[key] = this.sortOrders[key] * -1;
          }
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
            url:'users_admin?lang='+self.lang,
            success: function (data) {
              this.pages = data.length;
              self.data = data.map(function (item) {
                var last_log = (item.last_sign_in_at ? new Date(item.last_sign_in_at) : '');
                return {
                  role: [item.master, item.admin],
                  email: [md5(item.email.toLowerCase()), item.email],
                  last_sign_in_at: last_log.toLocaleString(),
                  id: item.id,
                };
              });
              self.$emit('data-loaded');
              var empty = '';
              if(self.data.length === 0){ $('#empty').show().html(empty);}
              self.filteredLength = data.length;
            }
          });
          $("#loading").hide();
          this.pop();
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
    }
 });


  var clientIndex = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['role', 'email', 'last_sign_in_at', 'id'],
      gridData: []
    }
  });
})();
