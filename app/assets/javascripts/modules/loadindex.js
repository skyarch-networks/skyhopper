//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

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
