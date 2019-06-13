//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const modal = require('./modal');

{
  //  ----------------------------- variables


  const ENDPOINT_BASE = '/app_settings';
  const INPUTS_SELECTOR = '#app-settings-form input[type=text],input[type=password],select,textarea,input[type=checkbox]';
  const REQUIRED_INPUTS = '#app-settings-form input[required],select[required],textarea[required]';


  //  --------------------------------  utility methods
  const getSettings = function getSettings() {
    const settings = {};
    $(INPUTS_SELECTOR).each(function inputSelectorEachHandler() {
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

  const RemoveEmptyOptionalParams = function RemoveEmptyOptionalParams(obj) {
    const OptionalKeys = ['vpc_id', 'subnet_id'];
    const object = obj;
    OptionalKeys.forEach((key) => {
      if (object[key] === '') {
        delete object[key];
      }
    });
    return object;
  };

  const isFillRequiredInput = function isFillRequiredInput() {
    const elements = document.querySelectorAll(REQUIRED_INPUTS);
    for (let i = 0; i < elements.length; +i) {
      if (elements[i].value === '') {
        return false;
      }
    }
    return true;
  };


  //  inputが全部埋まっていれば btn をenableにする。
  //  全部埋まっていなければdisableにする
  const switchBtnEnable = function switchBtnEnable(btn) {
    if (isFillRequiredInput()) {
      btn.removeAttr('disabled');
    } else {
      btn.attr('disabled', 'disabled');
    }
  };


  const updateCreatingChefserverProgress = function updateCreatingChefserverProgress(data) {
    const progress = $('#progress-create-system-server');
    const progressBar = progress.children('.progress-bar');
    const progressAlert = $('#alert-create-system-server');
    const currentPercentage = parseInt(progressBar.attr('area-valuenow'), 10);

    progressAlert.text(data.message);
    // 進捗していればプログレスバーを進める
    if (data.percentage !== null && parseInt(data.percentage, 10) > currentPercentage) {
      progressBar.attr('style', `width: ${data.percentage}%`).attr('area-valuenow', data.percentage);
    }

    if (data.status === 'complete') {
      progress.removeClass('progress-bar-striped active');
      progressBar.removeClass('progress-bar-info').addClass('progress-bar-success');
      progressAlert.removeClass('alert-info').addClass('alert-success');

      $('#done-appsetting').removeClass('disabled').removeAttr('disabled');
    } else if (data.status === 'error') {
      progress.removeClass('progress-bar-striped active');
      progressBar.removeClass('progress-bar-info').addClass('progress-bar-danger');
      progressAlert.removeClass('alert-info').addClass('alert-danger');
    }
  };


  const watchChefCreateProgress = function watchChefCreateProgress() {
    // TODO
    $('#btn-create-system-server').hide();
    $('.create-system-server').show();


    const ws = ws_connector('chef_server_deployment', 'status');
    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);

      updateCreatingChefserverProgress(parsed);
    };
  };


  //  -------------------------------- ajax methods
  const create = function create() {
    let settings = getSettings();
    settings = RemoveEmptyOptionalParams(settings);

    return $.ajax({
      url: ENDPOINT_BASE,
      type: 'POST',
      data: {
        settings: JSON.stringify(settings),
      },
    }).fail((xhr) => {
      function escapeHTML(string) {
        return string.replace(/[&'"<>]/g, match => ({
          '&': '&amp;',
          "'": '&#x;',
          '"': '&quot;',
          '<': '&lt;',
          '>': '&gt;',
        }[match]));
      }

      const res = xhr.responseJSON;
      const { kind } = res.error;
      if (kind.endsWith('VpcIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.vpc_id_not_found', { id: escapeHTML(settings.vpc_id) }), 'danger');
      } else if (kind.endsWith('SubnetIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.subnet_id_not_found', { id: escapeHTML(settings.subnet_id) }), 'danger');
      } else if (kind.endsWith('SystemServerError')) {
        modal.AlertHTML(kind, res.error.message, 'danger');
      } else {
        modal.AlertForAjaxStdError()(xhr);
      }
    });
  };

  // TODO 変数名を直す
  const chefCreate = function chefCreate() {
    return $.ajax({
      url: `${ENDPOINT_BASE}/system_server_create`,
      type: 'POST',
      data: {},
      dataType: 'json',
    }).fail(modal.AlertForAjaxStdError());
  };

  //  ----------------------------- event binding


  $(document).on('click', '#btn-create-system-server', (e) => {
    e.preventDefault();

    create().done(() => {
      chefCreate().done((data) => {
        updateCreatingChefserverProgress(data);
        watchChefCreateProgress();
      });
    });
  });


  $(document).on('change keyup', REQUIRED_INPUTS, () => {
    const btn = $('#btn-create-system-server');
    switchBtnEnable(btn);
  });


  $(document).on('click', '#btn-show-optional-inputs', (e) => {
    e.preventDefault();

    $('#btn-show-optional-inputs').hide();
    $('#optional-inputs').fadeIn('fast');
  });
}
