//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

var loadGif, glyphicon, bootstrap_confirm, bootstrap_alert, bootstrap_prompt;
(function () {
  "use strict";

  loadGif = $("<div class='loader'></div>");

  // helper of glyphicon
  glyphicon = function (icon_name) {
    return $("<span>").addClass("glyphicon glyphicon-" + icon_name);
  };


  var modal = function (title, message, modal_type, status, resolve_func) {
    var modal_footer = $("<div>", {class: "modal-footer"});

    var dfd = $.Deferred();

    var resolve;
    if (resolve_func) {
      resolve = resolve_func(dfd);
    } else {
      resolve = function () { dfd.resolve(); };
    }

    if (modal_type === "confirm") {
      modal_footer.append(
        $("<button>", {class: "btn btn-default", "data-dismiss": "modal", text: "Cancel"})
      ).append(
        $("<button>", {class: "btn btn-primary", "data-dismiss": "modal", text: "OK", click: resolve})
      );
    }
    else {
      modal_footer.append(
        $("<button>", {class: "btn btn-primary", "data-dismiss": "modal", text: "OK", click: resolve})
      );
    }

    var additional_class;
    if (status === "warning") {
      additional_class = "bg-warning";
    }
    else if (status === "danger") {
      additional_class = "bg-danger";
    }

    var modal_base = $("<div>", {class: "modal fade", "data-backdrop": "static"}).append(
      $("<div>", {class: "modal-dialog"}).append(
        $("<div>", {class: "modal-content"}).append(
          $("<div>", {class: "modal-header " + additional_class}).append(
            $("<button>", {class: "close", "data-dismiss": "modal"}).append(
              $("<span>", {"aria-hidden": "true", html: "&times;"})
            ).append(
              $("<span>", {class: "sr-only", text: "Close"})
            )
          ).append(
            $("<h4>", {class: "modal-title", text: title})
          )
        ).append(
          $("<div>", {class: "modal-body", html: message})
        ).append(
          modal_footer
        )
      )
    );

    modal_base.on('hidden.bs.modal', function (e) {
      modal_base.remove();
    });

    modal_base.appendTo("body").modal("show");

    return dfd.promise();
  };

  bootstrap_confirm = function (title, message, status) {
    return modal(title, message, "confirm", status);
  };

  bootstrap_alert = function (title, message, status) {
    return modal(title, message, "alert", status);
  };

  bootstrap_prompt = function (title, label, status) {
    var input_id = _.uniqueId('bootstrap_prompt_');
    var input = $('<form>', {class: 'form-horizontal'}).append(
      $('<div>', {class: 'form-group'}).append(
        $('<label>', {class: 'control-label col-sm-2', for: input_id, text: label})
      ).append(
        $('<div>', {class: 'col-sm-5'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: input_id})
        )
      )
    );

    var resolve_func = function (dfd) {
      return function () {
        var text = document.getElementById(input_id).value;
        dfd.resolve(text);
      };
    };

    return modal(title, input, "confirm", status, resolve_func);
  };
})();
