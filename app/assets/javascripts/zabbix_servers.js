//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(function () {
  'use_strict';

  //browserify functions for vue filters functionality
  var wrap = require('./modules/wrap');
  var listen = require('./modules/listen');
  var md5 = require('md5');
  var qs = require('query-string').parse(location.search);
  var modal = require('modal');
  var ZabbixServer  = require('models/zabbix_server').default;

  Vue.component('demo-grid', require('demo-grid.js'));


  var clientIndex = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['fqdn', 'version', 'details'],
      gridData: [],
      index: 'zabbix_servers',
      url: 'zabbix_servers?lang='+qs.lang,
      is_empty: false,
      loading: true,
      new_loader: false,
      picked: {
        users_admin_path: null,
        id: null
      },
      params: {
        fqdn: null,
        username: null,
        password: null,
        details: null,
        lang: qs.lang
      },
      control_type: null
    },
    methods:  {
      can_delete: function() {
        if (this.picked.delete_zabbix_server_path)
          return this.picked.delete_zabbix_server_path ? true : false;
      },
      can_edit: function() {
        if (this.picked.edit_zabbix_server_url)
          return this.picked.edit_zabbix_server_url ? true : false;
      },
      delete_entry: function()  {
        var self = this;
        modal.Confirm(t('zabbix_servers.zabbix'), t('zabbix_servers.msg.delete_server'), 'danger').done(function () {
          $.ajax({
            type: "POST",
            url: self.picked.delete_zabbix_server_path,
            dataType: "json",
            data: {"_method":"delete"},
            success: function (data) {
              self.gridData = data;
              self.picked = {};
            },
          }).fail(function() { location.reload(); });
        });
      },
      reload: function () {
        this.loading = true;
        this.$children[0].load_ajax(self.url);
        this.picked = {};
      },
      create: function (event) {
        event.preventDefault();
        var self = this;
        self.new_loader = true;

        var zabbix = new ZabbixServer(session_id);
        zabbix.create(self.params).done(function (data) {
            self.new_loader = false;
            modal.Alert(t('zabbix_servers.zabbix'), data.message, 'success').done(function(){
              location.assign(data.url);
            });
          }
        ).fail(function (msg)  {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
            self.new_loader = false;
        });
      },
      update: function(event){
        event.preventDefault();
        var self = this;
        self.new_loader = true;

        var zabbix = new ZabbixServer(session_id);
        zabbix.update(self.params).done(function (msg) {
            modal.Alert(t('zabbix_servers.zabbix'), msg, 'success').done(
              function () {
                location.assign(self.url);
              }
            );
          }
        ).fail(function (msg)  {
          modal.Alert(t('zabbix_servers.zabbix'), msg, 'danger');
        });
        self.new_loader = false;
      },
    },
    computed: {
      required_filed: function () {
        var params = this.params;
        return (params.fqdn &&
          params.username &&
          params.password
        );
      },
    },
    ready: function() {
      this.new_loader = false;
    },
  });
})();
