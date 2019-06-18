

function strategyGen(projectId) {
  const ajax = $.ajax({
    url: '/project_parameters.json',
    method: 'GET',
    data: {
      project_id: projectId,
    },
  });
  return {
    index: 1,
    match: /\$\{((?:[a-zA-Z_][a-zA-Z0-9_]*)?)$/,
    search(term, callback) {
      ajax.then((params) => {
        const p = params.filter(k => k.key.indexOf(term) === 0);
        callback(p);
      });
    },
    template(param) {
      const v = $('<div>').text(param.value).html();
      return `\${${param.key}} (${v})`;
    },
    replace(param) {
      return `\${${param.key}}`;
    },
  };
}
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = strategyGen;
