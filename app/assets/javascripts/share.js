//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//    このファイルには、全体で使いたい関数を定義する。

const t = function (scope, options) {
  return I18n.t(scope, options);
};


// show loading gif when a button is clicked

const bootstrap_alert_div = function (klass, content) {
  const alertDiv = $('<div>');
  content = content.replace(/\n/g, '<br />');
  alertDiv.addClass('alert').addClass(klass);

  alertDiv.html(content);
  return alertDiv;
};

const overwrite_by_alert = function (button, extraClass, content) {
  const target = button.parent();
  let klass = '';
  if (extraClass) { klass += extraClass; }

  const alertDiv = bootstrap_alert_div(klass, content);

  target.empty();
  target.append(alertDiv);
  return alertDiv;
};

const overwrite_by_loading_alert = function (button, content) {
  const progress = overwrite_by_alert(button, '', content);
  progress.prepend(loadGif);
  return progress;
};

const show_loading = function (target) {
  const load = $(`<span>${t('common.msg.loading')}</span>`);
  load.prepend(loadGif);
  target.html(load);
};

const get_query_strings = function () {
  let query_string = window.location.search;
  query_string = query_string.substr(1, query_string.length);

  const query_string_obj = {};
  const items = query_string.split('&');
  $.each(items, function () {
    const item = this;
    const splited_item = item.split('=');
    const key = splited_item[0];
    const val = splited_item[1];
    query_string_obj[key] = val;
  });
  return query_string_obj;
};

const get_query_string = function (key) {
  return get_query_strings()[key];
};


// Disable default behaviors of event
const cancel_default_event = function (event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

const add_filename_label = function (filename, before) {
  $('.filename_label').remove();
  before.after($('<span>').addClass('label label-default filename_label').text(filename));
};

// TODO: テキストファイル以外が投げられた場合は読み込まないようにしたい
const file_drop_func = function (id) {
  return function (e) {
    cancel_default_event(e);
    const file = e.originalEvent.dataTransfer.files[0];

    const fileReader = new FileReader();
    fileReader.onload = function (e) {
      $(id).val(e.target.result).trigger('change');
      add_filename_label(file.name, $(id));
    };
    fileReader.readAsText(file);

    if (id === '#keypair_value') {
      $('#keypair_name').val(file.name.replace(/\.\w+$/, ''));
    }
  };
};

$(document).ready(() => {
  // Drag'n'drop
  // TODO: id ではなく class で指定するようにしたい
  _.each(['#keypair_value', '#cf_template_value', '#add_modify_value'], (id) => {
    $(document).on('drop', id, file_drop_func(id));
    $(document).on('dragenter', id, cancel_default_event);
    $(document).on('dragover', id, cancel_default_event);
    $(id).change(() => { $('.filename_label').remove(); });
  });
});


const masking_input_form = function (btn, target) {
  target.attr('type', 'password');
  btn.children('span.glyphicon').removeClass('glyphicon-eye-close').addClass('glyphicon-eye-open');
};

const unmasking_input_form = function (btn, target) {
  target.attr('type', 'text');
  btn.children('span.glyphicon').removeClass('glyphicon-eye-open').addClass('glyphicon-eye-close');
};

const toggle_input_masking = function (btn, target) {
  if (target.attr('type') === 'text') {
    masking_input_form(btn, target);
  } else {
    unmasking_input_form(btn, target);
  }
};

const create_masked_input = function (input) {
  const target_id = input.attr('id');
  const btn_toggle = $('<button>', {
    class: 'btn btn-default toggle-input-masking',
    for: target_id,
  }).append(glyphicon('eye-open'));
  const input_group_btn = $('<span>', { class: 'input-group-btn' }).append(btn_toggle);

  input.wrap($('<div>').addClass('input-group'));
  input.parent().append(input_group_btn);

  masking_input_form(input_group_btn, input);
};

$(document).ready(() => {
  create_masked_input($('input.form-control-masked'));

  $(document).on('click', '.toggle-input-masking', function (e) {
    cancel_default_event(e);
    toggle_input_masking($(this), $(`#${$(this).attr('for')}`));
  });
});


// for websocket
const ws_connector = function (kind, id) {
  const ws_protocol = ((document.location.protocol === 'https:') ? 'wss:' : 'ws:');
  return new WebSocket(`${ws_protocol}//${location.hostname}/ws/${kind}/${id}`);
};


/* form-validation */
$(document).ready(() => {
  const inputs = $('input').filter('[type=text],[type=password],[type=email]').filter(':not(.allow-empty)');

  const is_input_filled = function () {
    let is_filled = true;

    inputs.each(function () {
      if ($(this).val().length === 0) {
        is_filled = false;
        return false;
      }
      if ($(this).attr('type') === 'password' && $(this).val().indexOf(' ') !== -1) {
        is_filled = false;
        return false;
      }
    });

    return is_filled;
  };

  const toggle_input = function () {
    const submit = $('.create');

    if (is_input_filled()) {
      submit.removeAttr('disabled');
    } else {
      submit.attr('disabled', 'disabled');
    }
  };

  toggle_input();

  inputs.bind('keyup change', () => {
    toggle_input();
  });
});

// allow textfile drop
$.event.props.push('dataTransfer');

$(document).on('dragover', '.allow_textfile_drop', (e) => {
  e.preventDefault();
});

$(document).on('drop', '.allow_textfile_drop', function (e) {
  self = this;
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  const fileReader = new FileReader();
  fileReader.onloadend = function () {
    $(self).val(fileReader.result).trigger('input');
  };
  fileReader.readAsText(file);
});

// setup clipboard.js
new Clipboard('[data-clipboard]').on('success', (e) => {
  const btn = $(e.trigger);
  const target = btn.find('.copied-hint-target');
  const hint_text = btn.attr('data-copied-hint');
  const orig_text = target.text();
  btn.attr('disabled', true);
  target.text(hint_text);
  setTimeout(() => {
    target.text(orig_text);
    btn.attr('disabled', null);
  }, 1000);
});

// setup vue-router
Vue.use(VueRouter);
