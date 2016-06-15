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


  var projectIndex = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['code','name', 'cloud_provider', 'access_key'],
      gridData: [],
      picked: {
        edit_url: null,
        project_settings: {
          dishes_path: null,
          key_pairs_path: null,
          project_parameters_path: null
        }
      },
      index: 'projects'
    },
    methods: {
      can_edit: function() {
        if (this.picked)
          return this.picked.edit_project_url ? true : false;
      },
      can_delete: function() {
        if (this.picked.delete_project_url)
          return (this.picked.code[1] === 0) ? true : false;
      },
      is_picked: function() {
        return (this.picked.id);
      },
      delete_entry: function()  {
        var self = this;
        modal.Confirm(t('projects.project'), t('projects.msg.delete_project'), 'danger').done(function () {
                $.ajax({
                    type: "POST",
                    url: self.picked.delete_project_url,
                    dataType: "json",
                    data: {"_method":"delete"},
                    success: function (data) {
                      self.gridData = data;
                      self.picked = null;
                    },
                }).fail(function() {location.reload();});
        });
      }
    },

  });
})();
