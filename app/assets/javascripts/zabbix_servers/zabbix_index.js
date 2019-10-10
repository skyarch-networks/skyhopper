//
// Copyright (c) 2013-2019 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string');
const demoGrid = require('../demo-grid.js');
const modal = require('../modal');

module.exports = () => {
  'use_strict';

  const qs = queryString.parse(window.location.search);

  Vue.component('demo-grid', demoGrid);

  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['fqdn', 'version', 'details'],
      gridData: [],
      index: 'zabbix_servers',
      url: `zabbix_servers?lang=${qs.lang}`,
      is_empty: false,
      loading: true,
      new_loader: false,
      picked: {
        users_admin_path: null,
        id: null,
      },
      control_type: null,
    },
    methods: {
      can_delete() {
        if (this.picked.delete_zabbix_server_path) {
          return !!this.picked.delete_zabbix_server_path;
        }
        return undefined;
      },
      can_edit() {
        if (this.picked.edit_zabbix_server_url) {
          return !!this.picked.edit_zabbix_server_url;
        }
        return undefined;
      },
      delete_entry() {
        const self = this;
        modal.Confirm(t('zabbix_servers.zabbix'), t('zabbix_servers.msg.delete_server'), 'danger').done(() => {
          $.ajax({
            type: 'POST',
            url: self.picked.delete_zabbix_server_path,
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
    mounted() {
      this.$nextTick(function ready() {
        this.new_loader = false;
      });
    },
  });
};
