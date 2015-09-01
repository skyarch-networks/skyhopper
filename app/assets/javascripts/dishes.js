//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {                //  for file local scope

  var ajax_dish = new AjaxSet.Resources("dishes");
  ajax_dish.add_member("validate", "POST");

  //browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  var parseURLParams = require('./modules/getURL');
  var dishesIndex = require('./modules/loadindex');

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
        option: ['dish'],
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
        self.columns = ['name','detail', 'status', 'id'];

       $.ajax({
           url:'dishes?lang='+self.lang,
           success: function (data) {
             this.pages = data.length;
             console.log(data);
             self.data = data.map(function (item) {
               return {
                 name: item.name,
                 detail: item.detail,
                 status: item.status,
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
    dishesIndex();
  });

  //    -----------------     functions

  var dish_body = function () {
    return $('#dish_body');
  };

  var current_dish_id = function () {
    return dish_body().attr('data-dish-id');
  };

  var set_current_dish_id = function (dish_id) {
    dish_body().attr('data-dish-id', dish_id);
  };


  var show_dish = function (dish_id) {
    var target = dish_body();

    show_loading(target);

    return $.ajax({
      url: '/dishes/' + dish_id
    }).done(function (data) {
      target.html(data);
    }).done(function (data) {
      // for websocket
      // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
      //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
      if (0 < $('.validating-dish').size()) {
        get_validate_status(dish_id, work_validate_progress_bar);
      }
    });

    //return ajax_dish.show({id: dish_id}).done(function(data){
    //  target.html(data);
    //}).done(function(data){
    //  // for websocket
    //  // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
    //  //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
    //  if (0 < $('.validating-dish').size()) {
    //    get_validate_status(dish_id, work_validate_progress_bar);
    //  }
    //});

  };


  //      ---------------------  for validate
  var validate = function (dish_id) {
    return $.ajax({
      url:  '/dishes/' + dish_id + '/validate',
      type: 'POST'
    });

    //return ajax_dish.validate({id: dish_id});
  };

  var is_validate_finish_status = function (status) {
    return status === 'SUCCESS' || status === 'FAILURE' || status === 'NOT YET';
  };

  var get_validate_status = function (dish_id, callback) {
    var ws = ws_connector('dish_validate', dish_id);

    ws.onmessage = function (msg) {
      var data = msg.data;
      callback(data, dish_id);
      if (is_validate_finish_status(data, dish_id)) {
        ws.close();
      }
    };
  };


  var work_validate_progress_bar = function (status, dish_id) {
    console.log(status);
    if (is_validate_finish_status(status)) {
      show_dish(current_dish_id());
    } else {
      if (dish_id !== current_dish_id()) return;

      var progress_bar = $('.validating-dish').children('.progress-bar');
      var progress;
      switch (status) {
        case "CREATING":
          progress = '20'; break;
        case "BOOTSTRAPPING":
          progress = '40'; break;
        case "APPLYING":
          progress = '60'; break;
        case "SERVERSPEC":
          progress = '80'; break;
        default:
          progress = '0';  break;
      }
      progress_bar.css('width', progress + "%");
      progress_bar.attr("aria-valuenow", progress);
      progress_bar.html(status);
    }
  };


  //      -----------------    event

  $(document).on('click', '.show-dish', function (e) {
    var btn     = $(this);
    var a      = btn.closest('a');
    var dish_id = a.attr('data-dish-id');
    var target  = dish_body();

    show_dish(dish_id).done(function (data) {
      //  show dish
      set_current_dish_id(dish_id);
      var tr = a.closest('tr');
      $('tr.info').removeClass('info');
      tr.addClass('info');

    }).fail(function (data) {
      bootstrap_alert(t('dishes.dish'), data.responseText, 'danger');
    });
  });

  $(document).on('click', '.edit-dish', function (e) {
    var btn = $(this);
    var dish_id = current_dish_id();

    $.ajax({
      url: '/dishes/' + dish_id + '/edit'
    }).done(function (data) {
      dish_body().html(data);
    }).fail(function (data) {
      bootstrap_alert(t('dishes.dish'), data.responseText, 'danger');
    });

    //ajax_dish.edit({id: dish_id}).done(function(data){
    //  dish_body().html(data);
    //}).fail(function(data){
    //  bootstrap_alert(t('dishes.dish'), data.responseText);
    //});
  });


  $(document).on('click', '.show-current-dish', function (e) {
    e.preventDefault();
    show_dish(current_dish_id());
  });


  $(document).on('click', '#update-dish', function (e) {
    var dish_id = current_dish_id();
    var run_list;

    if ($("#runlist").children().size() > 0) {
      runlist = $("#runlist").children();

      runlist = runlist.map(function () {
        return $(this).val();
      });
    }
    else {
      runlist = [];
    }

    var serverspec_ids = [];
    $("input[name=serverspecs]:checked").each(function () {
      serverspec_ids.push( $(this).val() );
    });

    runlist = $.makeArray(runlist);
    $.ajax({
      url     : "/dishes/" + dish_id,
      type    : "PUT",
      data    : {
        runlist     : runlist,
        serverspecs : serverspec_ids
      }
    }).done(function (data) {
      bootstrap_alert(t('dishes.dish'), data).done(function () {
        show_dish(current_dish_id());
      });
    }).fail(function (data) {
      bootstrap_alert(t('dishes.dish'), data.responseText, 'danger');
    });

    //ajax_dish.update({id: dish_id, runlist: runlist, serverspecs: serverspec_ids}).done(function(data){
    //  bootstrap_alert(t('dishes.dish'), data).done(function(){
    //    show_dish(current_dish_id());
    //  });
    //}).fail(function(data){
    //  bootstrap_alert(t('dishes.dish'), data.responseText);
    //});
  });


  $(document).on('click', '.validate-dish', function (e) {
    bootstrap_confirm(t('dishes.dish'), t('js.dishes.msg.ask_validate')).done(function () {
      var dish_id = current_dish_id();

      validate(dish_id).done(function (data) {
        bootstrap_alert(t('dishes.dish'), data).done(function() {
          show_dish(dish_id);
        });
      }).fail(function (data) {
        bootstrap_alert(t('dishes.dish'), data.responseText, 'danger');
      });
    });
  });
})();
