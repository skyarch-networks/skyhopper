//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string').parse(window.location.search);
const modal = require('./modal');
const demoGrid = require('./demo-grid.js');

(() => {
  'use_strict';

  Vue.component('demo-grid', demoGrid);

  if ($('#indexElement').length) {
    new Vue({
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
          modal.Confirm(t('users.user'), t('users.msg.delete_user', this.email), 'danger').done(() => {
            $.ajax({
              type: 'POST',
              url: this.picked.users_admin_path,
              dataType: 'json',
              data: { _method: 'delete' },
            }).done(() => {
              window.location.reload();
            }).fail(() => {
              window.location.reload();
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
})();
