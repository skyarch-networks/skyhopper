//
// Copyright (c) 2013-2019 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string');
const modal = require('../modal');
const ZabbixServer = require('../models/zabbix_server').default;

module.exports = () => {
  'use_strict';

  const qs = queryString.parse(window.location.search);

  new Vue({
    el: '#editElement',
    data: {
      url: `/zabbix_servers?lang=${qs.lang}`,
      new_loader: false,
      control_type: null,
      params: {
        fqdn: null,
        username: null,
        password: null,
        details: null,
        lang: qs.lang,
      },
    },
    methods: {
      update(event) {
        event.preventDefault();
        const self = this;
        self.new_loader = true;

        const zabbix = new ZabbixServer(session_id);
        zabbix.update(self.params).done((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'success').done(
            () => {
              window.location.assign(self.url);
            },
          );
        }).fail((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
        });
        self.new_loader = false;
      },
      load_ajax(request) {
        const self = this;
        $.ajax({
          cache: false,
          url: request,
          success(data) {
            self.params = data;
          },
        });
      },
      create(event) {
        event.preventDefault();
        const self = this;
        self.new_loader = true;

        const zabbix = new ZabbixServer(session_id);
        zabbix.create(self.params).done((data) => {
          self.new_loader = false;
          modal.Alert(t('zabbix_servers.zabbix'), data.message, 'success').done(() => {
            window.location.assign(data.url);
          });
        }).fail((msg) => {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
          self.new_loader = false;
        });
      },
    },
    computed: {
      required_filed() {
        const { params } = this;
        return (params.fqdn
          && params.username
          && params.password
        );
      },
    },
    mounted() {
      this.$nextTick(function ready() {
        this.load_ajax(window.location.pathname);
      });
    },
  });
};
