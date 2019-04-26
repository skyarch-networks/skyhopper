//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  Vue.component('div-loader', Loader);
  const modal = require('modal');

  const vm = new Vue({
    el: '#db-manage',
    data() {
      return {
        loading_export: false,
        loading_import: false,
      };
    },
    computed: {
      loading() { return this.loading_import || this.loading_export; },
    },
    methods: {
    },
  });
}());
