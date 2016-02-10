var modal = require('modal');

// Vueに登録したfilterを、外から見る方法ってないのかな。
var jsonParseErr = function (str) {
  if (_.trim(str) === '') {
    return 'JSON String is empty. Please input JSON.';
  }
  try {
    JSON.parse(str);
  } catch (ex) {
    return ex;
  }
};

var toLocaleString = function (datetext) {
  var date = new Date(datetext);
  return date.toLocaleString();
};


// Utilities
var alert_success = function (callback) {
  return function (msg) {
    var dfd = modal.Alert(t('infrastructures.infrastructure'), msg);
    if (callback) {
      dfd.done(callback);
    }
  };
};

var alert_danger = function (callback) {
  return function (msg) {
    if (!jsonParseErr(msg) && JSON.parse(msg).error) {
      modal.AlertForAjaxStdError(callback)(msg);
    } else {
      var dfd = modal.Alert(t('infrastructures.infrastructure'), msg, 'danger');
      if (callback) { dfd.done(callback); }
    }
  };
};

var alert_and_show_infra = alert_danger(function () {
  // XXX: doesn't work...
  require('infrastructures/show_infra').show_infra(current_infra.id);
});

module.exports = {
  jsonParseErr:         jsonParseErr,
  toLocaleString:       toLocaleString,
  alert_success:        alert_success,
  alert_danger:         alert_danger,
  alert_and_show_infra: alert_and_show_infra,
};
