//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//browserify functions for vue filters functionality
var wrap = require('./modules/wrap');
var listen = require('./modules/listen');
var queryString = require('query-string').parse(location.search);
var modal = require('modal');
var app;

Vue.component('demo-grid', require('demo-grid.js'));

var serverspecIndex = new Vue({
  el: '#indexElement',
  data: {
    searchQuery: '',
    gridColumns: ['serverspec_name','description'],
    gridData: [],
    index: 'serverspecs',
    picked: {
        serverspec_path: null,
        edit_serverspec_path: null
    },
    infra_id: queryString.infrastructure_id ? '&infrastructure_id='+queryString.infrastructure_id: '',
    url: 'serverspecs?lang='+this.lang+this.infra_id,
    is_empty: false,
    loading: true,
  },
    methods: {
      can_edit: function() {
        return this.picked.edit_serverspec_path === null ? true : false;
      },
      can_delete: function() {
        return (this.picked.serverspec_path === null) ? true: false;
      },
      delete_entry: function()  {
        var self = this;
        modal.Confirm(t('serverspecs.serverspec'), t('serverspecs.msg.delete_serverspec'), 'danger').done(function () {
          $.ajax({
            type: "POST",
            url: self.picked.serverspec_path,
            dataType: "json",
            data: {"_method":"delete"},
            success: function (data) {
                location.reload();
            },
        }).fail(modal.AlertForAjaxStdError());
        });
      },
      reload: function () {
        this.loading = true;
        this.$children[0].load_ajax(self.url);
        this.picked = {};
      },
      show_serverspec: function(serverspec_id) {
        $.ajax({
          url : "/serverspecs/" + serverspec_id,
          type : "GET",
          success : function (data) {
            $("#value-information").html(data);
          }
        });
        document.getElementById('value').style.display='';
      }
    },
});



require("serverspec-gen");
