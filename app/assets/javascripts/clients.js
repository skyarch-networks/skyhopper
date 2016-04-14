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
  var queryString = require('query-string').parse(location.search);
  var modal = require('modal');
  var app;

  Vue.component('demo-grid', require('demo-grid.js'));

  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['code','name'],
      gridData: [],
      lang: queryString.lang,
      picked: {
        edit_client_path: null,
        code: null
      },
      index: 'clients'
    },
    methods: {
      can_edit: function() {
        if (this.picked.edit_client_path)
          return this.picked.edit_client_path ? true : false;
      },
      can_delete: function() {
        if (this.picked.code)
          return (this.picked.code[1] > 0);
      },
      delete_entry: function()  {
        var self = this;
        modal.Confirm(t('clients.client'), t('clients.msg.delete_client'), 'danger').done(function () {
                $.ajax({
                    type: "POST",
                    url: self.picked.delete_client_path,
                    dataType: "json",
                    data: {"_method":"delete"},
                    success: function (data) {
                      self.gridData = data;
                    },
                }).fail(modal.AlertForAjaxStdError());
        });
      }

    }
  });

})();
