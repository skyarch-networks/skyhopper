//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string');
const modal = require('./modal');
const demoGrid = require('./demo-grid.js');

(() => {
  'use_strict';

  const queryStringParams = queryString.parse(window.location.search);

  Vue.component('demo-grid', demoGrid);

  if (!$('#indexElement').length) {
    return;
  }
  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['code', 'name'],
      gridData: [],
      lang: queryStringParams.lang,
      url: `clients?lang=${queryStringParams.lang}`,
      is_empty: false,
      loading: true,
      picked: {
        edit_client_path: null,
        code: null,
      },
      index: 'clients',
    },
    computed: {
      can_edit() {
        if (this.picked.edit_client_path) {
          return !!this.picked.edit_client_path;
        }
        return undefined;
      },
      can_delete() {
        if (this.picked.code) {
          return (this.picked.code[1] === 0);
        }
        return undefined;
      },
    },
    methods: {
      delete_entry() {
        const self = this;
        modal.Confirm(t('clients.client'), t('clients.msg.delete_client'), 'danger').done(() => {
          $.ajax({
            type: 'POST',
            url: self.picked.delete_client_path,
            dataType: 'json',
            data: { _method: 'delete' },
            success(data) {
              self.gridData = data;
              self.picked = {};
            },
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
})();
