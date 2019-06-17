const modal = require('modal');

// Vueに登録したfilterを、外から見る方法ってないのかな。
const jsonParseErr = function (str) {
  if (_.trim(str) === '') {
    return 'JSON String is empty. Please input JSON.';
  }
  try {
    JSON.parse(str);
  } catch (ex) {
    return ex.message;
  }
};

const toLocaleString = function (datetext) {
  const date = new Date(datetext);
  return date.toLocaleString();
};


// Utilities
const alert_success = function (callback) {
  return function (msg, is_html) {
    const func = (is_html) ? modal.AlertHTML : modal.Alert;
    const dfd = func(t('infrastructures.infrastructure'), msg);
    if (callback) {
      dfd.done(callback);
    }
  };
};

const alert_danger = function (callback) {
  return function (msg, is_html) {
    if (!jsonParseErr(msg) && JSON.parse(msg).error) {
      modal.AlertForAjaxStdError(callback)(msg);
    } else {
      const func = (is_html) ? modal.AlertHTML : modal.Alert;
      const dfd = func(t('infrastructures.infrastructure'), msg, 'danger');
      if (callback) { dfd.done(callback); }
    }
  };
};

const alert_and_show_infra = function (infra_id) {
  return alert_danger(() => {
    require('infrastructures/show_infra').show_infra(infra_id);
  });
};

module.exports = {
  jsonParseErr,
  toLocaleString,
  alert_success,
  alert_danger,
  alert_and_show_infra,
};
