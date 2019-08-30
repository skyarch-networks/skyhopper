//
// Copyright (c) 2013-2019 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
module.exports = {
  Loader: Vue.extend({
    template: '<span><div class="loader"></div> {{text}}</span>',
    data() {
      return {
        text: typeof t !== 'undefined' ? t('common.msg.loading') : '',
      };
    },
  }),
};
