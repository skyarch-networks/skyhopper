//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

// var loadGif = $("<img src='/assets/gif-load.gif' width='25' height='25'>");
var loadGif = $("<div class='loader'></div>");

// helper of glyphicon
var glyphicon = function (icon_name) {
  return $("<span>").addClass("glyphicon glyphicon-" + icon_name);
};


var modal = function (title, message, modal_type, status) {
  var modal_footer = $("<div>", {class: "modal-footer"});

  var dfd = $.Deferred();

  var resolve = function() {
    dfd.resolve();
  };

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

var bootstrap_confirm = function (title, message, status) {
  return modal(title, message, "confirm", status);
};

var bootstrap_alert = function (title, message, status) {
  return modal(title, message, "alert", status);
};
