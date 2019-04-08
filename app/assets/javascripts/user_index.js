//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(function () {
  'use_strict';

  // browserify functions for vue filters functionality
  const wrap = require('./modules/wrap');
  const listen = require('./modules/listen');
  const md5 = require('md5');
  const queryString = require('query-string').parse(location.search);
  const modal = require('modal');

  let app;

  Vue.component('demo-grid', require('demo-grid.js'));


  if ($('#indexElement').length) {
    const clientIndex = new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: ['role', 'email', 'last_sign_in_at'],
        gridData: [],
        index: 'user_admin',
        loading: true,
        is_empty: false,
        url: `users_admin?lang=${queryString.lang}`,
        picked: {
          users_admin_path: null,
          id: null,
        },
      },
      methods: {
        can_delete() {
          return (this.picked.users_admin_path === null);
        },
        can_edit() {
          return (this.picked.id === null);
        },

        delete_entry() {
          const self = this;
          modal.Confirm(t('users.user'), t('users.msg.delete_user', self.email), 'danger').done(() => {
            $.ajax({
              type: 'POST',
              url: self.picked.users_admin_path,
              dataType: 'json',
              data: { _method: 'delete' },
              success(data) {
                self.gridData = data;
                self.picked = {};
              },
            }).fail(() => {
              location.reload();
            });
          });
        },
        reload() {
          this.loading = true;
          this.$children[0].load_ajax(this.url);
          this.picked = {};
        },

      },
    });
  }
}());
