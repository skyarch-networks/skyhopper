interface ProjectParameter {
  key: string;
  value: string;
}

function strategyGen(project_id: number) {
  const ajax = $.ajax({
    url: '/project_parameters.json',
    method: 'GET',
    data: {
      project_id: project_id,
    }
  });

  return {
    index: 1,
    match: /\$\{((?:[a-zA-Z_][a-zA-Z0-9_]*)?)$/,

    search: function (term: string, callback: Function) {
      ajax.then((params: Array<ProjectParameter>) => {
        const p = params.filter(k => k.key.indexOf(term) === 0);
        callback(p);
      });
    },

    template: function (param: ProjectParameter) {
      // XXX: sanitize
      return '${' + param.key + '} (' + param.value + ')';
    },

    replace: function (param: ProjectParameter) {
      return "${" + param.key + '}';
    },
  };
}

export default strategyGen;
