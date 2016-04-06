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


Vue.config.debug = true;

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
      index: 'client'
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
        var delete_path = this.picked.delete_client_path;
        modal.Confirm(t('clients.client'), t('clients.msg.delete_client'), 'danger').done(function () {
                $.ajax({
                    type: "POST",
                    url: delete_path,
                    dataType: "json",
                    data: {"_method":"delete"},
                });
                event.preventDefault();
                location.reload();
        });
      }

    }
  });

})();
