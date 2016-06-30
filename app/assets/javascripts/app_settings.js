//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  "use strict";
  var modal = require('modal');

  //  ----------------------------- variables
  var queryString = require('query-string').parse(location.search);

  new Vue({
    el: '#indexElement',
    data: {
      key_select: null,
      params: {
        log_directory: null,
        access_key: null,
        secret_access_key: null,
        aws_region: null,
        keypair_name: null,
        keypair_value: null
      },
    },
    methods: {
      can_edit: function() {
        if (this.picked.edit_client_path)
          return this.picked.edit_client_path ? true : false;
      },
      create_key: function() {
        event.preventDefault();
        var params = this.params;
        var name_file;
        modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).then(function () {
          return modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name'));
        }).then(function (name) {
          if(!name){
            modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
            return;
          }
          console.log(name);
          name_file = name;
          return $.ajax({
            url: '/app_settings/generate_key',
            type: 'POST',
            data: {
              name:       name,
              region:     params.aws_region,
              access_key: params.access_key,
              secret_access_key: params.secret_access_key,
            },
          });

        }).done(function (key) {
          params.keypair_name = name_file;
          params.keypair_value = key.key_material;
          this.key_select = 2;

          // download file.
          var file = new File([key.key_material], name_file + '.pem');
          var url = window.URL.createObjectURL(file);
          var a = document.createElement('a');
          a.href = url;
          a.setAttribute('download', file.name);
          document.body.appendChild(a);
          a.click();
        }).fail(function (xhr) {
          modal.Alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
        });
      },
      create: function()  {
        event.preventDefault();

        var self = this;
        create(self.params).done(function (data) {
          chef_create().done(function (data) {
            update_creating_chefserver_progress(data);
            watch_chef_create_progress();
          });
        });


      }
    },
    computed: {
      keysExists: function () {
        var self = this;
        return (self.params.access_key && self.params.secret_access_key && self.params.aws_region);
      },
      required_filed: function () {
        var self = this;
        return (self.params.access_key
          && self.params.secret_access_key
          && self.params.aws_region
          && self.params.keypair_name
          && self.params.keypair_value
        );
      }


    }
  });


  var endpoint_base = '/app_settings';
  var inputs_selector = '#app-settings-form input[type=text],input[type=password],select,textarea';


  //  -------------------------------- ajax methods
  var create = function (settings) {

    return $.ajax({
      url: endpoint_base,
      type: 'POST',
      data: {
        settings: JSON.stringify(settings)
      },
    }).fail(modal.AlertForAjaxStdError());
  };

  var chef_create = function () {
    var stack_name = $('#chef_stack_name').val();

    return $.ajax({
      url: endpoint_base + '/chef_create',
      type: 'POST',
      data: {
        stack_name: stack_name,
      },
      dataType: "json",

    }).fail(modal.AlertForAjaxStdError());
  };


  //  --------------------------------  utility methods
  var get_settings = function () {
    var settings = {};
    $(inputs_selector).each(function () {
      var input = $(this);
      var key = input.attr('name');
      var val = input.val();
      settings[key] = val;
    });
    return settings;
  };


  var is_fill_input = function() {
    var set = get_settings();
    for (var i in set) {
      if (set[i] === '') {
        return false;
      }
    }
    return true;
  };


  //  inputが全部埋まっていれば btn をenableにする。
  //  全部埋まっていなければdisableにする
  var switch_btn_enable = function (btn) {
    if (is_fill_input()) {
      btn.removeAttr('disabled');
    } else {
      btn.attr('disabled', 'disabled');
    }
  };


  var watch_chef_create_progress = function () {
    // TODO
    $('#btn-create-chefserver').hide();
    $('.create-chefserver').show();


    var ws = ws_connector('chef_server_deployment', 'status');
    ws.onmessage = function (msg) {
      var parsed = JSON.parse(msg.data);

      update_creating_chefserver_progress(parsed);
    };
  };


  var update_creating_chefserver_progress = function (data) {
    var progress       = $("#progress-create-chefserver");
    var progress_bar   = progress.children(".progress-bar");
    var progress_alert = $("#alert-create-chefserver");
    var current_percentage = parseInt( progress_bar.attr("area-valuenow") );

    progress_alert.text(data.message);
    // 進捗していればプログレスバーを進める
    if (data.percentage !== null && parseInt(data.percentage) > current_percentage ) {
      progress_bar.attr("style", "width: " + data.percentage + "%").attr("area-valuenow", data.percentage);
    }

    if (data.status === "complete") {
      progress.removeClass("progress-bar-striped active");
      progress_bar.removeClass("progress-bar-info").addClass("progress-bar-success");
      progress_alert.removeClass("alert-info").addClass("alert-success");

      $("#done-appsetting").removeClass("disabled").removeAttr("disabled");
    }
    else if (data.status === "error") {
      progress.removeClass("progress-bar-striped active");
      progress_bar.removeClass("progress-bar-info").addClass("progress-bar-danger");
      progress_alert.removeClass("alert-info").addClass("alert-danger");
    }
  };



  //  ----------------------------- event binding


  $(document).on('click', '#btn-create-chefserver', function (e) {
    e.preventDefault();

    create().done(function (data) {
      chef_create().done(function (data) {
        update_creating_chefserver_progress(data);
        watch_chef_create_progress();
      });
    });


  });


  $(document).on('change keyup', inputs_selector, function () {
    var btn = $('#btn-create-chefserver');
    switch_btn_enable(btn);
  });



})();
