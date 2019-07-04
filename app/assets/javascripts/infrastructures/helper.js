const modal = require('../modal');

// Vueに登録したfilterを、外から見る方法ってないのかな。
const jsonParseErr = (str) => {
  if (str.trim() === '') {
    return 'JSON String is empty. Please input JSON.';
  }
  try {
    JSON.parse(str);
  } catch (ex) {
    return ex.message;
  }
  return undefined;
};

const toLocaleString = (datetext) => {
  const date = new Date(datetext);
  return date.toLocaleString();
};


// Utilities
const alertSuccess = callback => (msg, isHtml) => {
  const func = (isHtml) ? modal.AlertHTML : modal.Alert;
  const dfd = func(t('infrastructures.infrastructure'), msg);
  if (callback) {
    dfd.done(callback);
  }
};

const alertDanger = callback => (msg, isHtml) => {
  if (!jsonParseErr(msg) && JSON.parse(msg).error) {
    modal.AlertForAjaxStdError(callback)(msg);
  } else {
    const func = (isHtml) ? modal.AlertHTML : modal.Alert;
    const dfd = func(t('infrastructures.infrastructure'), msg, 'danger');
    if (callback) { dfd.done(callback); }
  }
};

const alertAndShowInfra = infraId => alertDanger(() => {
  require('../infrastructures/show_infra').show_infra(infraId);
});

module.exports = {
  jsonParseErr,
  toLocaleString,
  alert_success: alertSuccess,
  alert_danger: alertDanger,
  alert_and_show_infra: alertAndShowInfra,
};
