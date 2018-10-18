var Infrastructure = require('models/infrastructure').default;
var newVM = require('modules/newVM');


var SHOW_INFRA_ID = '#infra-show';
var app;

var show_infra = function (infra_id, current_tab) {
  if (app) {
    app.$destroy();
  }
  app = newVM(
    infra_id,
    current_tab
  );
  app.$mount(SHOW_INFRA_ID);
};

module.exports = {
  SHOW_INFRA_ID: SHOW_INFRA_ID,
  show_infra: show_infra
};
