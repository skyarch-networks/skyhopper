//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  const modal = require('modal');

  //  ----------------------------- variables


  const endpoint_base = '/app_settings';
  const inputs_selector = '#app-settings-form input[type=text],input[type=password],select,textarea,input[type=checkbox]';
  const required_inputs = '#app-settings-form input[required],select[required],textarea[required]';


  //  -------------------------------- ajax methods
  const create = function () {
    let settings = get_settings();
    settings = remove_empty_optional_params(settings);

    return $.ajax({
      url: endpoint_base,
      type: 'POST',
      data: {
        settings: JSON.stringify(settings),
      },
    }).fail((xhr) => {
      const res = xhr.responseJSON;
      const kind = res.error.kind;
      if (kind.endsWith('VpcIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.vpc_id_not_found', { id: _.escape(settings.vpc_id) }), 'danger');
      } else if (kind.endsWith('SubnetIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.subnet_id_not_found', { id: _.escape(settings.subnet_id) }), 'danger');
      } else if (kind.endsWith('SystemServerError')) {
        modal.AlertHTML(kind, res.error.message, 'danger');
      } else {
        modal.AlertForAjaxStdError()(xhr);
      }
    });
  };

  // TODO 変数名を直す
  const chef_create = function () {
    return $.ajax({
      url: `${endpoint_base}/system_server_create`,
      type: 'POST',
      data: {},
      dataType: 'json',
    }).fail(modal.AlertForAjaxStdError());
  };


  //  --------------------------------  utility methods
  var get_settings = function () {
    const settings = {};
    $(inputs_selector).each(function () {
      const input = $(this);
      const key = input.attr('name');
      if (input.is(':checkbox')) {
        settings[key] = input.prop('checked');
        return;
      }
      const val = input.val();
      settings[key] = val;
    });
    return settings;
  };

  var remove_empty_optional_params = function (obj) {
    const optional_keys = ['vpc_id', 'subnet_id'];
    optional_keys.forEach((key) => {
      if (obj[key] === '') {
        delete obj[key];
      }
    });
    return obj;
  };

  const is_fill_required_input = function () {
    const elements = document.querySelectorAll(required_inputs);
    for (let i = 0; i < elements.length; ++i) {
      if (elements[i].value === '') {
        return false;
      }
    }
    return true;
  };


  //  inputが全部埋まっていれば btn をenableにする。
  //  全部埋まっていなければdisableにする
  const switch_btn_enable = function (btn) {
    if (is_fill_required_input()) {
      btn.removeAttr('disabled');
    } else {
      btn.attr('disabled', 'disabled');
    }
  };


  const watch_chef_create_progress = function () {
    // TODO
    $('#btn-create-system-server').hide();
    $('.create-system-server').show();


    const ws = ws_connector('chef_server_deployment', 'status');
    ws.onmessage = function (msg) {
      const parsed = JSON.parse(msg.data);

      update_creating_chefserver_progress(parsed);
    };
  };


  var update_creating_chefserver_progress = function (data) {
    const progress = $('#progress-create-system-server');
    const progress_bar = progress.children('.progress-bar');
    const progress_alert = $('#alert-create-system-server');
    const current_percentage = parseInt(progress_bar.attr('area-valuenow'));

    progress_alert.text(data.message);
    // 進捗していればプログレスバーを進める
    if (data.percentage !== null && parseInt(data.percentage) > current_percentage) {
      progress_bar.attr('style', `width: ${data.percentage}%`).attr('area-valuenow', data.percentage);
    }

    if (data.status === 'complete') {
      progress.removeClass('progress-bar-striped active');
      progress_bar.removeClass('progress-bar-info').addClass('progress-bar-success');
      progress_alert.removeClass('alert-info').addClass('alert-success');

      $('#done-appsetting').removeClass('disabled').removeAttr('disabled');
    } else if (data.status === 'error') {
      progress.removeClass('progress-bar-striped active');
      progress_bar.removeClass('progress-bar-info').addClass('progress-bar-danger');
      progress_alert.removeClass('alert-info').addClass('alert-danger');
    }
  };


  //  ----------------------------- event binding


  $(document).on('click', '#btn-create-system-server', (e) => {
    e.preventDefault();

    create().done((data) => {
      chef_create().done((data) => {
        update_creating_chefserver_progress(data);
        watch_chef_create_progress();
      });
    });
  });


  $(document).on('change keyup', required_inputs, () => {
    const btn = $('#btn-create-system-server');
    switch_btn_enable(btn);
  });


  $(document).on('click', '#btn-show-optional-inputs', (e) => {
    e.preventDefault();

    $('#btn-show-optional-inputs').hide();
    $('#optional-inputs').fadeIn('fast');
  });
}());
