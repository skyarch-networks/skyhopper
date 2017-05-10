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
      creating: false,
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
      onFileChange: function (e) {
          var files = e.target.files || e.dataTransfer.files;
          if (!files.length) return;
          this.createFile(files[0]);
      },
      createFile: function(file) {
          var reader = new FileReader();
          var vm = this.params;

          reader.onload = function (e) {
              vm.keypair_value = e.target.result;
          };
          reader.readAsText(file);


          vm.keypair_name = file.name.replace(/\.\w+$/, '');
          console.log(vm);
      },
      removeFile: function (e) {
          e.preventDefault();
          var vm = this.params;
          modal.Confirm(t('app_settings.title.setup'), t('app_settings.msg.delete_file', {name: vm.keypair_name}), 'danger').done(function () {
            vm.keypair_name = null;
            vm.keypair_value = null;
          });

      },
      create_key: function(event) {
        event.preventDefault();
        var params = this.params;
        var name_file;
        modal.Confirm(t('app_settings.title.setup'), t('ec2_private_keys.confirm.create')).then(function () {
          return modal.Prompt(t('app_settings.title.setup'), t('key_pairs.name'));
        }).then(function (name) {
          if(!name){
            modal.Alert(t('app_settings.title.setup'), t('ec2_private_keys.msg.please_name'), 'danger');
            return;
          }
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
          modal.Alert(t('app_settings.title.setup'), xhr.responseText, 'danger');
        });
      },
      create_skyhopper: function(event)  {
        var self = this;
        $("#application-logo").addClass('disabled');
        $("#drop3").addClass('disabled');

        create(self.params).done(function (data) {
          chef_create().done(function (data) {
            self.creating = true;
            update_creating_chefserver_progress(data);
            watch_chef_create_progress();
          });
        }).fail(function () {
          self.creating = false;
          $("#application-logo").removeClass('disabled');
          $("#drop3").removeClass('disabled');
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
        return (self.params.access_key &&
          self.params.secret_access_key &&
          self.params.aws_region &&
          self.params.keypair_name &&
          self.params.keypair_value
        );
      },
      isAllowedBrowser: function()  {
        var allowed;

        if(!!window.chrome && !!window.chrome.webstore){
          allowed = true;
        }else if (typeof InstallTrigger !== 'undefined') {
          allowed = true;
        }else {
          allowed = false;
        }

        return allowed;
      },
    },
    ready: function () {
      introJs();
        // The rest of the code
        $("#flexi_form_start").click(function() {
            introJs().start().onbeforechange(function(targetElement) {
              $(".steps").hide();
              $(".left").css("float", "left");
              $("input").removeClass("error");
              $(".right").hide();
              switch($(targetElement).attr("data-step")) {
                case "2":
                  $(".flexi_form").hide();
                  $(targetElement).show();
                  break;
                case "3":
                  $("input").addClass("error");
                  $(targetElement).show();
                  break;
                case "4":
                  $(".left").css("float", "none");
                  $(targetElement).show();
                  break;
                case "5":
                  $(".right").show();
                  $(targetElement).show();
                  break;
              }
            });
          });

    }
  });




  var endpoint_base = '/app_settings';
  var inputs_selector = '#app-settings-form input[type=text],input[type=password],select,textarea';
  var required_inputs = '#app-settings-form input[required],select[required],textarea[required]';


  //  -------------------------------- ajax methods
  var create = function (settings) {
    var settings = get_settings();
    settings = remove_empty_optional_params(settings);

    return $.ajax({
      url: endpoint_base,
      type: 'POST',
      data: {
        settings: JSON.stringify(settings)
      },
    }).fail(function (xhr) {
      var res = xhr.responseJSON;
      var kind = res.error.kind;
      if (kind.endsWith('VpcIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.vpc_id_not_found', {id: _.escape(settings.vpc_id)}), 'danger');
      } else if (kind.endsWith('SubnetIDNotFound')) {
        modal.AlertHTML(kind, t('app_settings.msg.subnet_id_not_found', {id: _.escape(settings.subnet_id)}), 'danger');
      } else {
        modal.AlertForAjaxStdError()(xhr);
      }
    });
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

  var remove_empty_optional_params = function (obj) {
    var optional_keys = ['vpc_id', 'subnet_id'];
    optional_keys.forEach(function (key) {
      if (obj[key] === '') {
        delete obj[key];
      }
    });
    return obj;
  };

  var is_fill_required_input = function () {
    var elements = get_settings();
    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].value === '') {
        return false;
      }
    }
    return true;
  };


  //  inputが全部埋まっていれば btn をenableにする。
  //  全部埋まっていなければdisableにする
  var switch_btn_enable = function (btn) {
    if (is_fill_required_input()) {
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
      $("#wrapper").addClass('toggled');
      $("#signup").addClass('in');
      $("#application-logo").removeClass('disabled');
      $("#drop3").removeClass('disabled');
    }
    else if (data.status === "error") {
      progress.removeClass("progress-bar-striped active");
      progress_bar.removeClass("progress-bar-info").addClass("progress-bar-danger");
      progress_alert.removeClass("alert-info").addClass("alert-danger");
    }
  };


})();
