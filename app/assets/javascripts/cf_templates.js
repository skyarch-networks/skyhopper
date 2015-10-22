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
        lang: queryString.lang,
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
        var id =  queryString.client_id;
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

  var editor;
  $(document).ready(function(){
    cf_templatesIndex();

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

  function resizeAce() {
    
    return $('#description').height($(window).height());
  };

  //listen for changes
  $(window).resize(resizeAce);
  //set initially
  resizeAce();

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
