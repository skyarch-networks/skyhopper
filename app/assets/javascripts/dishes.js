//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string').parse(window.location.search);
const modal = require('./modal');
const demoGrid = require('./demo-grid');

(() => { //  for file local scope
  const ajaxDish = new AjaxSet.Resources('dishes');
  ajaxDish.add_member('validate', 'POST');

  const dishUrl = queryString.project_id ? `&project_id=${queryString.project_id}` : '';

  Vue.component('demo-grid', demoGrid);

  if ($('#indexElement').length) {
    new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: ['dish_name', 'detail', 'status'],
        gridData: [],
        index: 'dishes',
        project_id: queryString.project_id ? `&project_id=${queryString.project_id}` : '',
        url: `dishes?lang=${queryString.lang}${dishUrl}`,
        is_empty: false,
        loading: true,
        picked: {
          dish_path: null,
        },
      },
      methods: {
        can_delete() {
          return !(this.picked.dish_path);
        },

        delete_entry() {
          const self = this;
          modal.Confirm(t('dishes.dish'), t('dishes.msg.delete_dish'), 'danger').done(() => {
            $.ajax({
              url: self.picked.dish_path,
              type: 'POST',
              dataType: 'json',
              data: { _method: 'delete' },
              success() {
                window.location.reload();
              },
            }).fail(modal.AlertForAjaxStdError());
          });
        },

        show_dish(item) {
          showDish(item).done(() => {
            //  show dish
            setCurrentDishId(item);
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

  const dishBody = () => $('#dish_body');

  const currentDishId = () => dishBody().attr('data-dish-id');

  const setCurrentDishId = (dishId) => {
    dishBody().attr('data-dish-id', dishId);
  };

  const showDish = (dishId) => {
    const target = dishBody();

    showLoading(target);

    return $.ajax({
      url: `/dishes/${dishId}`,
    }).done((data) => {
      target.html(data);
    }).done(() => {
      // for websocket
      // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
      //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
      if ($('.validating-dish').size() > 0) {
        getValidateStatus(dishId, workValidateProgressBar);
      }
    });

    // return ajaxDish.show({id: dishId}).done(function(data){
    //  target.html(data);
    // }).done(function(data){
    //  // for websocket
    //  // TODO: 複数回show_dishを呼び出すと、複数channelを見てしまう。
    //  //       今のところバグにはなっていないが、パフォーマンス的に怪しいのとバグの温床になるので何とかしたい。
    //  if (0 < $('.validating-dish').size()) {
    //    getValidateStatus(dishId, workValidateProgressBar);
    //  }
    // });
  };


  //      ---------------------  for validate
  const validate = dishId => $.ajax({
    url: `/dishes/${dishId}/validate`,
    type: 'POST',
  }); // return ajaxDish.validate({id: dishId});

  const isValidateFinishStatus = status => (status === 'SUCCESS' || status === 'FAILURE' || status === 'NOT YET');

  const getValidateStatus = (dishId, callback) => {
    const ws = wsConnector('dish_validate', dishId);

    ws.onmessage = (msg) => {
      const { data } = msg;
      callback(data, dishId);
      if (isValidateFinishStatus(data, dishId)) {
        ws.close();
      }
    };
  };


  const workValidateProgressBar = (status, dishId) => {
    if (isValidateFinishStatus(status)) {
      showDish(currentDishId());
    } else {
      if (dishId !== currentDishId()) return;

      const progressBar = $('.validating-dish').children('.progress-bar');
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
      progressBar.css('width', `${progress}%`);
      progressBar.attr('aria-valuenow', progress);
      progressBar.html(status);
    }
  };


  //      -----------------    event

  $(document).on('click', '.edit-dish', () => {
    const dishId = currentDishId();

    $.ajax({
      url: `/dishes/${dishId}/edit`,
    }).done((data) => {
      dishBody().html(data);
    }).fail((data) => {
      modal.Alert(t('dishes.dish'), data.responseText, 'danger');
    });

    // ajaxDish.edit({id: dishId}).done(function(data){
    //  dishBody().html(data);
    // }).fail(function(data){
    //  modal.Alert(t('dishes.dish'), data.responseText);
    // });
  });


  $(document).on('click', '.show-current-dish', (e) => {
    e.preventDefault();
    showDish(currentDishId());
  });


  $(document).on('click', '#update-dish', () => {
    const dishId = currentDishId();

    /* eslint-disable no-undef */
    const playbookRoles = editPlaybookForm.playbook_roles;
    const extraVars = editPlaybookForm.extra_vars;
    /* eslint-enable no-undef */

    const serverspecIds = [];
    $('input[name=serverspecs]:checked').each(function serverspecsCheckedEachHandler() {
      serverspecIds.push($(this).val());
    });

    $.ajax({
      url: `/dishes/${dishId}`,
      type: 'PUT',
      data: {
        playbook_roles: JSON.stringify(playbookRoles),
        extra_vars: extraVars,
        serverspecs: serverspecIds,
      },
    }).done((data) => {
      modal.Alert(t('dishes.dish'), data).done(() => {
        showDish(currentDishId());
      });
    }).fail((data) => {
      modal.Alert(t('dishes.dish'), data.responseText, 'danger');
    });

    // ajaxDish.update({id: dishId, runlist: runlist, serverspecs: serverspecIds}).done(function(data){
    //  modal.Alert(t('dishes.dish'), data).done(function(){
    //    showDish(currentDishId());
    //  });
    // }).fail(function(data){
    //  modal.Alert(t('dishes.dish'), data.responseText);
    // });
  });


  $(document).on('click', '.validate-dish', () => {
    modal.Confirm(t('dishes.dish'), t('js.dishes.msg.ask_validate')).done(() => {
      const dishId = currentDishId();

      validate(dishId).done((data) => {
        modal.Alert(t('dishes.dish'), data).done(() => {
          showDish(dishId);
        });
      }).fail((data) => {
        modal.Alert(t('dishes.dish'), data.responseText, 'danger');
      });
    });
  });
})();
