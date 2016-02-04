var Infrastructure = require('models/infrastructure').default;
var newVM = require('modules/newVM');


var SHOW_INFRA_ID = '#infra-show';
var app;

var show_infra = function (infra_id, current_tab) {
  var infra = new Infrastructure(infra_id);

  var l = new Loader();
  l.text = "Loading...";
  l.$mount(SHOW_INFRA_ID);
  if (app) {
    app.$destroy();
  }
  infra.show().done(function (stack) {
    app = newVM(
      stack,
      infra,
      current_tab
    );
    l.$destroy();
    app.$mount(SHOW_INFRA_ID);
  });
};

module.exports = {
  SHOW_INFRA_ID: SHOW_INFRA_ID,
  show_infra: show_infra
};
