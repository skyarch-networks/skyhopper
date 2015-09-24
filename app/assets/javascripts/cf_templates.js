//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function() {

  //browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  var parseURLParams = require('./modules/getURL');
  var cf_templatesIndex = require('./modules/loadindex');

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
        option: ['cf_template'],
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
        var id =  this.parseURLParams('client_id');
        self.lang = this.parseURLParams('lang');
        self.columns = ['subject','details', 'id'];

       $.ajax({
           cache: false,
           url:'cf_templates?lang='+self.lang,
           success: function (data) {
             this.pages = data.length;
             self.data = data.map(function (item) {
               return {
                 subject: item.name,
                 details: item.detail,
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
    cf_templatesIndex();
  });

  $(document).on("click", ".show-template", function () {
    var cf_template_id = $(this).closest("a").attr("data-managejson-id");
    var tr = $(this).closest('tr');
    $('tr.info').removeClass('info');
    tr.addClass('info');

    $.ajax({
      url : "/cf_templates/" + cf_template_id,
      type : "GET",
      success : function (data) {
        $("#template-information").html(data);
      }
    });
  });


})();
