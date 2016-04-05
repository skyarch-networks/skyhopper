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
  var queryString = require('query-string').parse(location.search);
  var modal = require('modal');
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
        option: ['client'],
        lang: queryString.lang,
        pages: 10,
        pageNumber: 0,
        filteredLength: null,
        picked: null
        };
      },
    methods: {
      sortBy: function (key) {
          if(key !== 'id'){
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
      select_entry: function(item)  {
        this.$parent.picked = item;
        this.picked = item;
      },
      show_entry: function(item){
        window.location.assign("/projects?lang="+this.lang+"&client_id="+item.id+"");
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
        var il = new Loader();
        var self = this;
        self.loading = true;
        var id =  queryString.client_id;

       $.ajax({
           cache: false,
           url:'clients?lang='+self.lang,
           success: function (data) {
             console.log(data);

             this.pages = data.length;
             self.data = data.map(function (item) {
               return {
                 code: [item.code,item.projects],
                 name: item.name,
                 id: item.id,
                 can_edit: item.can_edit,
                 can_delete: item.can_delete,
                 edit_url: item.edit_url
               };
             });
             self.$emit('data-loaded');
             var empty = t('projects.msg.empty-list');
             if(self.data.length === 0){ $('#empty').show().html(empty);}
             self.filteredLength = data.length;
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
      count: function (arr) {
        // record length
        this.$set('filteredLength', arr.length);
        // return it intact
        return arr;
      }
    },
 });


  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['code','name'],
      gridData: [],
      lang: queryString.lang,
      picked: null,
    },
    methods: {
      can_edit: function() {
        if (this.picked)
          return this.picked.can_edit ? true : false;
      },
      can_delete: function() {
        if (this.picked)
          return this.picked.can_delete ? true : false;
      },
      delete_entry: function()  {
        var id = this.picked.id;
        modal.Confirm(t('clients.client'), t('clients.msg.delete_client'), 'danger').done(function () {
                $.ajax({
                    type: "POST",
                    url: "/clients/"+id+"?lang="+this.lang,
                    dataType: "json",
                    data: {"_method":"delete"},
                });
                event.preventDefault();
                location.reload();
        });
      }

    }
  });

})();
