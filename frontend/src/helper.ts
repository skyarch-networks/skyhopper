/// <reference path="../declares.d.ts" />
const loadGif = $('<div class="loader"></div>');

// helper of glyphicon
const glyphicon = function (icon_name: string): JQuery {
  return $("<span>").addClass("glyphicon glyphicon-" + icon_name);
};


module Modal {
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
    });

    return dfd;
  };

  export const confirm = function (title: string, message: string, status?: string): JQueryPromise<any> {
    return modal(title, message, ModalType.confirm, status);
  };

  export const alert = function (title: string, message: string, status?: string): JQueryPromise<any> {
    return modal(title, message, ModalType.alert, status);
  };

  export const prompt = function (title: string, label: string, status?: string): JQueryPromise<any> {
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
}

// alias names.
const bootstrap_confirm = Modal.confirm;
const bootstrap_alert   = Modal.alert;
const bootstrap_prompt  = Modal.prompt;



// <bootstrap-tooltip title="tooltip title">
//   <div>Your content</div>
// </bootstrap-tooltip>
Vue.component('bootstrap-tooltip', {
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  template: '<span data-toggle="tooltip" data-original-title="{{title}}"><content></content></span>',
  compiled: function () {
    console.log(this);
    $(this.$el).tooltip();
  },
});

const Loader = Vue.extend({
  template: '<span><div class="loader"></div> {{text}}</span>',
  props: {
    text: {
      type: String,
    },
  },
  data: () => {return {
    text: t('common.msg.loading'),
  }; },
});

Vue.component('div-loader', Loader);

// Example: $.ajax().done(...).fail(modal_for_ajax_std_error(function(){doSomething();}));
const modal_for_ajax_std_error = function (callback?: () => void) {
  return function (xhr: XMLHttpRequest | string): void {
    const t = typeof xhr === "string" ? xhr : xhr.responseText;
    const ex = JSON.parse(t).error;
    const dfd = bootstrap_alert(ex.kind, ex.message, 'danger');
    if (callback) { dfd.done(callback); }
  };
};
