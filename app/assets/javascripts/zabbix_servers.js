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
      gridColumns: ['fqdn', 'version', 'details', 'username'],
      gridData: [],
      index: 'zabbix_servers',
      picked: {
        users_admin_path: null,
        id: null
      }
    },
    methods:  {
      can_delete: function() {
        return (this.picked.users_admin_path === null);
      },
      can_edit: function() {
        return (this.picked.id === null);
      },

      delete_entry: function()  {
        var self = this;
        modal.Confirm(t('users.user'), t('users.msg.delete_user', self.email), 'danger').done(function () {
          $.ajax({
            type: "POST",
            url: self.picked.users_admin_path,
            dataType: "json",
            data: {"_method":"delete"},
            success: function (data) {
              self.gridData = data;
              self.picked = {};
            },
          }).fail(function() { location.reload(); });
        });
      }

    }
  });
})();
