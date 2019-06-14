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

  const projectUrl = queryStringParams.client_id ? `&client_id=${queryStringParams.client_id}` : '';

  if (!$('#indexElement').length) {
    return;
  }
  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['code', 'name', 'access_key'],
      url: `projects?lang=${queryStringParams.lang}${projectUrl}`,
      gridData: [],
      is_empty: false,
      loading: true,
      picked: {
        edit_url: null,
        project_settings: {
          dishes_path: null,
          key_pairs_path: null,
          project_parameters_path: null,
        },
      },
      index: 'projects',
    },
    methods: {
      can_edit() {
        if (this.picked) {
          return !!this.picked.edit_project_url;
        }
        return undefined;
      },
      can_delete() {
        if (this.picked.delete_project_url) {
          return (this.picked.code[1] === 0);
        }
        return undefined;
      },
      is_picked() {
        return (this.picked.id);
      },
      delete_entry() {
        const self = this;
        modal.Confirm(t('projects.project'), t('projects.msg.delete_project'), 'danger').done(() => {
          $.ajax({
            type: 'POST',
            url: self.picked.delete_project_url,
            dataType: 'json',
            data: { _method: 'delete' },
            success(data) {
              self.gridData = data;
              self.picked = null;
            },
          }).fail(() => {
            window.location.reload();
          });
        });
      },
      reload() {
        this.loading = true;
        this.$children[0].load_ajax(this.url);
      },
    },
  });
})();
