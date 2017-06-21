//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  'use strict';

  Vue.component('div-loader', Loader);
  var modal = require('modal');

  var vm = new Vue({
    el: '#db-manage',
    data: function () {
      return {
        loading_export: false,
        loading_import: false,
      };
    },
    computed: {
      loading: function () { return this.loading_import || this.loading_export; },
    },
    methods: {
    },
    ready: function () {
    },
  });
})();
