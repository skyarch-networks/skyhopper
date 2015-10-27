//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../declares.d.ts" />

const enum ModalType {
  confirm,
  alert,
}

/**
 * @method modal
 * @param {String} title
 * @param {String} message
 * @param {ModalType} modal_type If confirm, modal have cancel button.
 * @param {String} status warning, danger(optional)
 * @param {func($.Deferred) => func()} resolve_func
 * @return {$.Deferred}
 */
const modal = function (
  title: string,
  message: string | JQuery,
  modal_type: ModalType,
  status: string,
  resolve_func?: (_dfd: JQueryDeferred<any>) => (() => void)
): JQueryDeferred<any> {
  const modal_footer = $('<div>', {class: 'modal-footer'});
  const dfd = $.Deferred();

  let resolve: () => void;
  if (resolve_func) {
    resolve = resolve_func(dfd);
  } else {
    resolve = function(){dfd.resolve(); };
  }

  if (modal_type === ModalType.confirm) {
    modal_footer.append(
      $('<button>', {class: 'btn btn-default', 'data-dismiss': 'modal', text: 'Cancel'})
    );
  }
  modal_footer.append(
    $("<button>", {class: "btn btn-primary", "data-dismiss": "modal", text: "OK", click: resolve})
  );

  let additional_class = "";
  if (status === "warning") {
    additional_class = "bg-warning";
  } else if (status === "danger") {
    additional_class = "bg-danger";
  }

  const modal_base = $("<div>", {class: "modal fade", "data-backdrop": "static"}).append(
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

  modal_base.appendTo('body').modal('show');

  modal_base.children().draggable({
    cursor: "move",
    containment: ".modal-backdrop",
    handle: ".modal-header",
  });

  return dfd;
};

export function Confirm(title: string, message: string, status?: string): JQueryPromise<any> {
  return modal(title, message, ModalType.confirm, status);
};

export function Alert(title: string, message: string, status?: string): JQueryPromise<any> {
  return modal(title, message, ModalType.alert, status);
};

export function Prompt(title: string, label: string, status?: string): JQueryPromise<any> {
  const input_id = _.uniqueId('bootstrap_prompt_');
  const input = $('<form>', {class: 'form-horizontal'}).append(
    $('<div>', {class: 'form-group'}).append(
      $('<label>', {class: 'control-label col-sm-2', for: input_id, text: label})
    ).append(
      $('<div>', {class: 'col-sm-5'}).append(
        $('<input>', {class: 'form-control', type: 'text', id: input_id})
      )
    )
  );

  const resolve_func = function (dfd: JQueryDeferred<any>) {
    return function () {
      const text = (<HTMLInputElement>document.getElementById(input_id)).value;
      dfd.resolve(text);
    };
  };

  const dfd = modal(title, input, ModalType.confirm, status, resolve_func);

  input.on('keypress', function (e) {
    const ENTER = 13;
    if ((e.which && e.which === ENTER) || (e.keyCode && e.keyCode === ENTER)) {
      input.closest('.modal').modal('hide');
      resolve_func(dfd)();
      return false;
    }
    return true;
  });

  return dfd;
};

// alias names. TODO: Delete the following functions
// const bootstrap_confirm = Modal.confirm;
// const bootstrap_alert   = Modal.alert;
// const bootstrap_prompt  = Modal.prompt;


// Example: $.ajax().done(...).fail(modal_for_ajax_std_error(function(){doSomething();}));
export function ModalForAjaxStdError(callback?: () => void) {
  return function (xhr: XMLHttpRequest | string): void {
    const t = typeof xhr === "string" ? xhr : xhr.responseText;
    const ex = JSON.parse(t).error;
    const dfd = Alert(ex.kind, ex.message, 'danger');
    if (callback) { dfd.done(callback); }
  };
};
