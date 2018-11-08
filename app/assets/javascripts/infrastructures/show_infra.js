var queryString = require('query-string');
var SHOW_INFRA_ID = '#infra-show';
var show_infra;

var initialize = function (show_infra_func) {
  show_infra = show_infra_func;
};

var show_infra = function (infra_id, current_tab) {
  show_infra(infra_id, current_tab);
};

var reload_infra_index_page = function () {
  var parsed_query_string  = queryString.parse(location.search);
  var project_id_query = parsed_query_string.project_id ? '&project_id=' + parsed_query_string.project_id : '';
  location.href = '/infrastructures?lang=' + parsed_query_string.lang + project_id_query;
};

module.exports = {
  SHOW_INFRA_ID: SHOW_INFRA_ID,
  initialize: initialize,
  show_infra: show_infra,
  reload_infra_index_page: reload_infra_index_page,
};
