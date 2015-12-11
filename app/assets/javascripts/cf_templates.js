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
  var queryString = require('query-string').parse(location.search);
  var ace = require('brace');
  require('brace/theme/github');
  require('brace/mode/json');

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
        option: ['cf_template'],
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
        var self = this;
        self.loading = true;

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
    }
  });

  var editor;
  $(document).ready(function(){

    if ($('#description').length > 0) {
      editor = ace.edit("description");
      var textarea = $('#cf_template_value');
      editor.getSession().setValue(textarea.val());
      editor.getSession().on('change', function(){
        textarea.val(editor.getSession().getValue());
      });
      editor.setOptions({
        maxLines: 30,
        minLines: 15,
      });
      editor.setTheme("ace/theme/github");
      editor.getSession().setMode("ace/mode/json");
      $("#ace-loading").hide();
    }
  });

  var cf_templatesIndex = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['subject','details', 'id'],
      gridData: []
    }
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
    }).done(function () {
      var viewer = ace.edit('cf_value');
      viewer.setOptions({
        maxLines: Infinity,
        minLines: 15,
        readOnly: true
      });
      viewer.setTheme("ace/theme/github");
      viewer.getSession().setMode("ace/mode/json");
    });
  });
})();
