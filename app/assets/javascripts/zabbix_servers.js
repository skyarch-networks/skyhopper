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
  const qs = require('query-string').parse(location.search);
  const modal = require('modal');
  const ZabbixServer = require('models/zabbix_server').default;

  Vue.component('demo-grid', require('demo-grid.js'));


  const clientIndex = new Vue({
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
      params: {
        fqdn: null,
        username: null,
        password: null,
        details: null,
        lang: qs.lang,
      },
      control_type: null,
    },
    methods: {
      can_delete() {
        if (this.picked.delete_zabbix_server_path) return !!this.picked.delete_zabbix_server_path;
      },
      can_edit() {
        if (this.picked.edit_zabbix_server_url) return !!this.picked.edit_zabbix_server_url;
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
          }).fail(() => { location.reload(); });
        });
      },
      reload() {
        this.loading = true;
        this.$children[0].load_ajax(self.url);
        this.picked = {};
      },
      create(event) {
        event.preventDefault();
        const self = this;
        self.new_loader = true;

        const zabbix = new ZabbixServer(session_id);
        zabbix.create(self.params).done((data) => {
          self.new_loader = false;
          modal.Alert(t('zabbix_servers.zabbix'), data.message, 'success').done(() => {
            location.assign(data.url);
          });
        }).fail((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
          self.new_loader = false;
        });
      },
      update(event) {
        event.preventDefault();
        const self = this;
        self.new_loader = true;

        const zabbix = new ZabbixServer(session_id);
        zabbix.update(self.params).done((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'success').done(
            () => {
              location.assign(self.url);
            },
          );
        }).fail((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
        });
        self.new_loader = false;
      },
    },
    computed: {
      required_filed() {
        const params = this.params;
        return (params.fqdn
          && params.username
          && params.password
        );
      },
    },
    mounted() {
      this.$nextTick(function () {
        this.new_loader = false;
      });
    },
  });
}());
