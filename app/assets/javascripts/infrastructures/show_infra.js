const queryString = require('query-string');

const SHOW_INFRA_ID = '#infra-show';

const initialize = (showInfraFunc) => {
  showInfra = showInfraFunc;
};

let showInfra = (infraId, currentTab) => {
  showInfra(infraId, currentTab);
};

const reloadInfraIndexPage = () => {
  const parsedQueryString = queryString.parse(window.location.search);
  const projectIdQuery = parsedQueryString.project_id ? `&project_id=${parsedQueryString.project_id}` : '';
  window.location.href = `/infrastructures?lang=${parsedQueryString.lang}${projectIdQuery}`;
};

module.exports = {
  SHOW_INFRA_ID,
  initialize,
  show_infra: showInfra,
  reload_infra_index_page: reloadInfraIndexPage,
};
