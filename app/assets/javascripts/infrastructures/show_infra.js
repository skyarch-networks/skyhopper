var SHOW_INFRA_ID = '#infra-show';
var show_infra;

var initialize = function (show_infra_func) {
  show_infra = show_infra_func;
};

var show_infra = function (infra_id, current_tab) {
  show_infra(infra_id, current_tab);
};

module.exports = {
  SHOW_INFRA_ID: SHOW_INFRA_ID,
  initialize: initialize,
  show_infra: show_infra
};
