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
  var queryString = require('query-string').parse(location.search);
  var modal = require('modal');

  var app;

  Vue.component('demo-grid', require('demo-grid.js'));


  var clientIndex = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['fqdn', 'version', 'details'],
      gridData: [],
      index: 'zabbix_servers',
      url: 'zabbix_servers?lang='+self.lang,
      is_empty: false,
      loading: true,
      picked: {
        users_admin_path: null,
        id: null
      }
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
      register: function () {
        var self = this;
        self.loading = true;
        var infra = new Infrastructure(this.infra_id);
        var ec2 = new EC2Instance(infra, self.physical_id);

        ec2.bootstrap()
          .done(alert_success(self._show_ec2))
          .fail(alert_danger(self._show_ec2));
      },
    },
  });
})();
