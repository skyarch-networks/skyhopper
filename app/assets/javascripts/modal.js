

const modal = (title, message, modalType, status, resolveFunc) => {
  const modalFooter = $('<div>', { class: 'modal-footer' });
  const modalBody = $('<div>', { class: 'modal-body' });
  const dfd = $.Deferred();
  let resolve;
  if (resolveFunc) {
    resolve = resolveFunc(dfd);
  } else {
    resolve = () => { dfd.resolve(); };
  }
  if (modalType === 0 || modalType === 1) {
    modalFooter.append($('<button>', { class: 'btn btn-default', 'data-dismiss': 'modal', text: 'Cancel' }));
  }
  if (message instanceof jQuery || modalType === 1 || modalType === 3) {
    modalBody.append($('<div>', { html: message }));
  } else {
    modalBody.append($('<div>', { text: message }));
  }
  modalFooter.append($('<button>', {
    class: 'btn btn-primary', 'data-dismiss': 'modal', text: 'OK', click: resolve,
  }));
  let additionalClass = '';
  if (status === 'warning') {
    additionalClass = 'bg-warning';
  } else if (status === 'danger') {
    additionalClass = 'bg-danger';
  }
  const modalBase = $('<div>', { class: 'modal fade', 'data-backdrop': 'static' }).append($('<div>', { class: 'modal-dialog' })
    .append($('<div>', { class: 'modal-content' }).append($('<div>', { class: `modal-header ${additionalClass}` })
      .append($('<button>', { class: 'close', 'data-dismiss': 'modal' }).append($('<span>', { 'aria-hidden': 'true', html: '&times;' }))
        .append($('<span>', { class: 'sr-only', text: 'Close' })))
      .append($('<h4>', { class: 'modal-title', text: title }))).append(modalBody).append(modalFooter)));
  modalBase.on('hidden.bs.modal', () => {
    modalBase.remove();
  });
  modalBase.appendTo('body').modal('show');
  modalBase.children().draggable({
    cursor: 'move',
    containment: '.modal-backdrop',
    handle: '.modal-header',
  });
  return dfd;
};
function Confirm(title, message, status) {
  return modal(title, message, 0, status);
}
exports.Confirm = Confirm;

function Alert(title, message, status) {
  return modal(title, message, 2, status);
}
exports.Alert = Alert;

function ConfirmHTML(title, message, status) {
  return modal(title, message, 1, status);
}
exports.ConfirmHTML = ConfirmHTML;

function AlertHTML(title, message, status) {
  return modal(title, message, 3, status);
}
exports.AlertHTML = AlertHTML;

let idCount = 1;
function Prompt(title, label, status) {
  const inputId = `bootstrap_prompt_${idCount}`;
  idCount += 1;
  const input = $('<form>', { class: 'form-horizontal' }).append($('<div>', { class: 'form-group' })
    .append($('<label>', { class: 'control-label col-sm-2', for: inputId, text: label }))
    .append($('<div>', { class: 'col-sm-5' }).append($('<input>', { class: 'form-control', type: 'text', id: inputId }))));
  const resolveFunc = dfd => () => {
    const text = document.getElementById(inputId).value;
    dfd.resolve(text);
  };
  const dfd = modal(title, input, 1, status, resolveFunc);
  input.on('keypress', (e) => {
    const ENTER = 13;
    if ((e.which && e.which === ENTER) || (e.keyCode && e.keyCode === ENTER)) {
      input.closest('.modal').modal('hide');
      resolveFunc(dfd)();
      return false;
    }
    return true;
  });
  return dfd;
}
exports.Prompt = Prompt;

function AlertForAjaxStdError(callback) {
  return (xhr) => {
    const t = typeof xhr === 'string' ? xhr : xhr.responseText;
    const ex = JSON.parse(t).error;
    const dfd = Alert(ex.kind, ex.message, 'danger');
    if (callback) {
      dfd.done(callback);
    }
  };
}
exports.AlertForAjaxStdError = AlertForAjaxStdError;
