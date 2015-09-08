module.exports = function () {
    return new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: [],//['stack_name', 'region', 'keypairname', 'created_at', 'status', 'id'],
        gridData: []
      }
    });
};
