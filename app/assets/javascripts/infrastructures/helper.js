var modal = require('modal');
var yaml = require('js-yaml');

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

var yamlParseErr = function (str) {
  if (_.trim(str) === '') {
    return 'YAML String is empty. Please input YAML.';
  }
  try {
    yaml.safeLoad(str);
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
  return function (msg, is_html) {
    var func = (is_html) ? modal.AlertHTML : modal.Alert;
    var dfd = func(t('infrastructures.infrastructure'), msg);
    if (callback) {
      dfd.done(callback);
    }
  };
};

var alert_danger = function (callback) {
  return function (msg, is_html) {
    if (!jsonParseErr(msg) && JSON.parse(msg).error) {
      modal.AlertForAjaxStdError(callback)(msg);
    } else {
      var func = (is_html) ? modal.AlertHTML : modal.Alert;
      var dfd = func(t('infrastructures.infrastructure'), msg, 'danger');
      if (callback) { dfd.done(callback); }
    }
  };
};

var alert_and_show_infra = function (infra_id) {
  return alert_danger(function () {
    require('infrastructures/show_infra').show_infra(infra_id);
  });
};

module.exports = {
  jsonParseErr:         jsonParseErr,
  yamlParseErr:         yamlParseErr,
  toLocaleString:       toLocaleString,
  alert_success:        alert_success,
  alert_danger:         alert_danger,
  alert_and_show_infra: alert_and_show_infra,
};
