const queryString = require('query-string');

const SHOW_INFRA_ID = '#infra-show';
var show_infra;

const initialize = function (show_infra_func) {
  show_infra = show_infra_func;
};

var show_infra = function (infra_id, current_tab) {
  show_infra(infra_id, current_tab);
};

const reload_infra_index_page = function () {
  const parsed_query_string = queryString.parse(location.search);
  const project_id_query = parsed_query_string.project_id ? `&project_id=${parsed_query_string.project_id}` : '';
  location.href = `/infrastructures?lang=${parsed_query_string.lang}${project_id_query}`;
};

module.exports = {
  SHOW_INFRA_ID,
  initialize,
  show_infra,
  reload_infra_index_page,
};
