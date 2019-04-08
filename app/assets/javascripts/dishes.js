//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () { //  for file local scope
  const ajax_dish = new AjaxSet.Resources('dishes');
  ajax_dish.add_member('validate', 'POST');

  // browserify functions for vue filters functionality
  const wrap = require('./modules/wrap');
  const listen = require('./modules/listen');
  const modal = require('modal');
  const queryString = require('query-string').parse(location.search);
  const dish_url = queryString.project_id ? `&project_id=${queryString.project_id}` : '';
  let app;

  Vue.component('demo-grid', require('demo-grid.js'));

  if ($('#indexElement').length) {
    const dishIndex = new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: ['dish_name', 'detail', 'status'],
        gridData: [],
        index: 'dishes',
        project_id: queryString.project_id ? `&project_id=${queryString.project_id}` : '',
        url: `dishes?lang=${queryString.lang}${dish_url}`,
        is_empty: false,
        loading: true,
        picked: {
          dish_path: null,
        },
      },
      methods: {
        can_delete() {
          return (this.picked.dish_path === null);
        },

        delete_entry() {
          const self = this;
          modal.Confirm(t('dishes.dish'), t('dishes.msg.delete_dish'), 'danger').done(() => {
            $.ajax({
              url: self.picked.dish_path,
              type: 'POST',
              dataType: 'json',
              data: { _method: 'delete' },
              success(data) {
                location.reload();
              },
            }).fail(modal.AlertForAjaxStdError());
          });
        },

        show_dish(item) {
          const self = this;
          show_dish(item).done((data) => {
            //  show dish
            set_current_dish_id(item);
          }).fail((data) => {
            modal.Alert(t('dishes.dish'), data.responseText, 'danger');
          });
        },
        reload() {
          this.loading = true;
          this.$children[0].load_ajax(this.url);
          this.picked = {};
        },

      },
    });
  }

  //    -----------------     functions

  const dish_body = function () {
    return $('#dish_body');
  };

  const current_dish_id = function () {
    return dish_body().attr('data-dish-id');
  };

  var set_current_dish_id = function (dish_id) {
    dish_body().attr('data-dish-id', dish_id);
  };


  var show_dish = function (dish_id) {
    const target = dish_body();

    show_loading(target);

    return $.ajax({
      url: `/dishes/${dish_id}`,
    }).done((data) => {
      target.html(data);
    }).done((data) => {
      // for websocket
      // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
      //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
      if ($('.validating-dish').size() > 0) {
        get_validate_status(dish_id, work_validate_progress_bar);
      }
    });

    // return ajax_dish.show({id: dish_id}).done(function(data){
    //  target.html(data);
    // }).done(function(data){
    //  // for websocket
    //  // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
    //  //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
    //  if (0 < $('.validating-dish').size()) {
    //    get_validate_status(dish_id, work_validate_progress_bar);
    //  }
    // });
  };


  //      ---------------------  for validate
  const validate = function (dish_id) {
    return $.ajax({
      url: `/dishes/${dish_id}/validate`,
      type: 'POST',
    });

    // return ajax_dish.validate({id: dish_id});
  };

  const is_validate_finish_status = function (status) {
    return status === 'SUCCESS' || status === 'FAILURE' || status === 'NOT YET';
  };

  var get_validate_status = function (dish_id, callback) {
    const ws = ws_connector('dish_validate', dish_id);

    ws.onmessage = function (msg) {
      const data = msg.data;
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

      const progress_bar = $('.validating-dish').children('.progress-bar');
      let progress;
      switch (status) {
        case 'CREATING':
          progress = '20'; break;
        case 'BOOTSTRAPPING':
          progress = '40'; break;
        case 'APPLYING':
          progress = '60'; break;
        case 'SERVERSPEC':
          progress = '80'; break;
        default:
          progress = '0'; break;
      }
      progress_bar.css('width', `${progress}%`);
      progress_bar.attr('aria-valuenow', progress);
      progress_bar.html(status);
    }
  };


  //      -----------------    event

  $(document).on('click', '.edit-dish', function (e) {
    const btn = $(this);
    const dish_id = current_dish_id();

    $.ajax({
      url: `/dishes/${dish_id}/edit`,
    }).done((data) => {
      dish_body().html(data);
    }).fail((data) => {
      modal.Alert(t('dishes.dish'), data.responseText, 'danger');
    });

    // ajax_dish.edit({id: dish_id}).done(function(data){
    //  dish_body().html(data);
    // }).fail(function(data){
    //  modal.Alert(t('dishes.dish'), data.responseText);
    // });
  });


  $(document).on('click', '.show-current-dish', (e) => {
    e.preventDefault();
    show_dish(current_dish_id());
  });


  $(document).on('click', '#update-dish', (e) => {
    const dish_id = current_dish_id();
    let run_list;

    if ($('#runlist').children().size() > 0) {
      runlist = $('#runlist').children();

      runlist = runlist.map(function () {
        return $(this).val();
      });
    } else {
      runlist = [];
    }

    const serverspec_ids = [];
    $('input[name=serverspecs]:checked').each(function () {
      serverspec_ids.push($(this).val());
    });

    runlist = $.makeArray(runlist);
    $.ajax({
      url: `/dishes/${dish_id}`,
      type: 'PUT',
      data: {
        runlist,
        serverspecs: serverspec_ids,
      },
    }).done((data) => {
      modal.Alert(t('dishes.dish'), data).done(() => {
        show_dish(current_dish_id());
      });
    }).fail((data) => {
      modal.Alert(t('dishes.dish'), data.responseText, 'danger');
    });

    // ajax_dish.update({id: dish_id, runlist: runlist, serverspecs: serverspec_ids}).done(function(data){
    //  modal.Alert(t('dishes.dish'), data).done(function(){
    //    show_dish(current_dish_id());
    //  });
    // }).fail(function(data){
    //  modal.Alert(t('dishes.dish'), data.responseText);
    // });
  });


  $(document).on('click', '.validate-dish', (e) => {
    modal.Confirm(t('dishes.dish'), t('js.dishes.msg.ask_validate')).done(() => {
      const dish_id = current_dish_id();

      validate(dish_id).done((data) => {
        modal.Alert(t('dishes.dish'), data).done(() => {
          show_dish(dish_id);
        });
      }).fail((data) => {
        modal.Alert(t('dishes.dish'), data.responseText, 'danger');
      });
    });
  });
}());
