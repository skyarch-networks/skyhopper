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
  const queryString = require('query-string').parse(location.search);
  const modal = require('modal');
  let app;

  Vue.component('demo-grid', require('demo-grid.js'));

  const project_url = queryString.client_id ? `&client_id=${queryString.client_id}` : '';

  if ($('#indexElement').length) {
    const projectIndex = new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: ['code', 'name', 'access_key'],
        url: `projects?lang=${queryString.lang}${project_url}`,
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
          if (this.picked) return !!this.picked.edit_project_url;
        },
        can_delete() {
          if (this.picked.delete_project_url) return (this.picked.code[1] === 0);
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
              location.reload();
            });
          });
        },
        reload() {
          this.loading = true;
          this.$children[0].load_ajax(this.url);
        },
      },

    });
  }
}());
