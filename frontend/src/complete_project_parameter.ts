function strategyGen(project_id: number) {
  return {
    match: /\$\{((?:[a-zA-Z_][a-zA-Z0-9_]*)?)$/,

    search: function (term: string, callback: Function) {
      $.ajax({
        url: '/project_parameters.json',
        method: 'GET',
        data: {
          project_id: project_id,
        }
      }).then((params: Array<any>) => {
        const p = params
          .map(pa => pa.key)
          .filter(k => k.indexOf(term) === 0);
        callback(p);
      });
    },

    template: function (value: string) {
      return '${' + value + '}';
    },
    replace: function (word: string) {
      return "${" + word + '}';
    },
    index: 1,
  };
}

export default strategyGen;
