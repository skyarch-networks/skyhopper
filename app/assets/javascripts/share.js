//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//    このファイルには、全体で使いたい関数を定義する。

var t = function (scope, options) {
  return I18n.t(scope, options);
};


//show loading gif when a button is clicked

var bootstrap_alert_div = function (klass, content) {
    var alertDiv = $("<div>");
    content = content.replace(/\n/g, "<br />");
    alertDiv.addClass("alert").addClass(klass);

    alertDiv.html(content);
    return alertDiv;
};

var overwrite_by_alert = function (button, extraClass, content) {
  var target = button.parent();
  var klass  = "";
  if (extraClass) {klass += extraClass;}

  var alertDiv = bootstrap_alert_div(klass, content);

  target.empty();
  target.append(alertDiv);
  return alertDiv;
};

var overwrite_by_loading_alert = function (button, content) {
  var progress = overwrite_by_alert(button, "", content);
  progress.prepend(loadGif);
  return progress;
};

var show_loading = function (target) {
  var load = $("<span>" + t('common.msg.loading') + "</span>");
  load.prepend(loadGif);
  target.html(load);
};

var get_query_strings = function () {
  var query_string = window.location.search;
  query_string = query_string.substr(1, query_string.length);

  var query_string_obj = {};
  var items = query_string.split('&');
  $.each(items, function () {
    var item = this;
    var splited_item = item.split('=');
    var key = splited_item[0];
    var val = splited_item[1];
    query_string_obj[key] = val;
  });
  return query_string_obj;
};

var get_query_string = function (key) {
  return get_query_strings()[key];
};



// Disable default behaviors of event
var cancel_default_event = function (event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

var add_filename_label = function (filename, before) {
  $(".filename_label").remove();
  before.after($("<span>").addClass("label label-default filename_label").text(filename));
};

// TODO: テキストファイル以外が投げられた場合は読み込まないようにしたい
var file_drop_func = function (id) {
  return function (e) {
    cancel_default_event(e);
    var file = e.originalEvent.dataTransfer.files[0];

    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      $(id).val(e.target.result).trigger("change");
      add_filename_label(file.name, $(id));
    };
    fileReader.readAsText(file);

    if (id === "#keypair_value") {
      $("#keypair_name").val(file.name.replace(/\.\w+$/, ''));
    }
  };
};

$(document).ready(function () {
  // Drag'n'drop
  // TODO: id ではなく class で指定するようにしたい
  _.each(["#keypair_value", "#cf_template_value", "#add_modify_value"], function (id) {
    $(document).on("drop", id, file_drop_func(id));
    $(document).on("dragenter", id, cancel_default_event);
    $(document).on("dragover", id, cancel_default_event);
    $(id).change(function () { $(".filename_label").remove(); });
  });
});


var masking_input_form = function (btn, target) {
  target.attr("type", "password");
  btn.children("span.glyphicon").removeClass("glyphicon-eye-close").addClass("glyphicon-eye-open");
};

var unmasking_input_form = function (btn, target) {
  target.attr("type", "text");
  btn.children("span.glyphicon").removeClass("glyphicon-eye-open").addClass("glyphicon-eye-close");
};

var toggle_input_masking = function (btn, target) {
  if (target.attr("type") === "text") {
    masking_input_form(btn, target);
  }
  else {
    unmasking_input_form(btn, target);
  }
};

var create_masked_input = function (input) {
  var target_id = input.attr("id");
  var btn_toggle = $("<button>", {
    class: "btn btn-default toggle-input-masking",
    for: target_id
  }).append( glyphicon("eye-open") );
  var input_group_btn = $("<span>", {class: "input-group-btn"}).append( btn_toggle );

  input.wrap( $("<div>").addClass("input-group") );
  input.parent().append(input_group_btn);

  masking_input_form(input_group_btn, input);
};

$(document).ready(function() {
  create_masked_input( $("input.form-control-masked") );

  $(document).on("click", ".toggle-input-masking", function (e) {
    cancel_default_event(e);
    toggle_input_masking($(this), $("#" + $(this).attr("for")) );
  });
});


// for websocket
var ws_connector = function (kind, id) {
  return new WebSocket('ws://' + location.hostname + '/ws/' + kind + '/' + id );
};


/* form-validation */
$(document).ready(function () {
  var inputs = $('input').filter("[type=text],[type=password],[type=email]").filter(':not(.allow-empty)');

  var is_input_filled = function() {
    var is_filled = true;

    inputs.each(function () {
      if ( $(this).val().length === 0 ) {
        is_filled = false;
        return false;
      }
      if ( $(this).attr("type") === "password" && $(this).val().indexOf(" ") !== -1 ) {
        is_filled = false;
        return false;
      }
    });

    return is_filled;
  };

  var toggle_input = function () {
    var submit = $(".create");

    if ( is_input_filled() ) {
      submit.removeAttr('disabled');
    }
    else {
      submit.attr('disabled', 'disabled');
    }
  };

  toggle_input();

  inputs.bind("keyup change", function () {
    toggle_input();
  });
});

// allow textfile drop
$.event.props.push("dataTransfer");

$(document).on("dragover", ".allow_textfile_drop", function(e){
  e.preventDefault();
});

$(document).on("drop", ".allow_textfile_drop", function(e){
  self = this;
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  var fileReader = new FileReader();
  fileReader.onloadend = function(){
    $(self).val(fileReader.result).trigger("input");
  };
  fileReader.readAsText(file);
});

// setup clipboard.js
new Clipboard('[data-clipboard]').on('success', function (e) {
  var btn = $(e.trigger);
  var target = btn.find('.copied-hint-target');
  var hint_text = btn.attr('data-copied-hint');
  var orig_text = target.text();
  btn.attr('disabled', true);
  target.text(hint_text);
  setTimeout(function () {
    target.text(orig_text);
    btn.attr('disabled', null);
  }, 1000);
});
