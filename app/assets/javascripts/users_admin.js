//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {        //  for file local scope

  var ajax_users_admin = new AjaxSet.Resources("users_admin");
  ajax_users_admin.add_collection('sync_zabbix', 'PUT');

  var highlight_user_row = function (selected_user) {
    $(".user-row").removeClass("info");
    selected_user.addClass("info");
  };

  var sync_zabbix = function (btn) {
    var f = function () {
      var reload = function (){
        // ここでdisabled を消さないと、何故かリロードしてもdisabledがついたままになる(FireFox で確認)
        btn.prop('disabled', false);
        location.reload();
      };

      btn.prop('disabled', true);
      var frag = $(document.createDocumentFragment());
      var p = $("<p>");
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      ajax_users_admin.sync_zabbix().done(function (data) {
        bootstrap_alert(t('users.title'), data).done(reload);
      }).fail(modal_for_ajax_std_error(reload));
    };

    bootstrap_confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  };










  $(document).on("click", "#apply-permission-edit", function (e) {
    e.preventDefault();

    var user_id = $("#user-id").val();

    var password = $("input#password").val();
    var password_confirmation = $("input#password_confirmation").val();

    var is_checked_master = $("#user_master").is(':checked');
    var is_checked_admin  = $("#user_admin").is(':checked');

    var allowed_projects = [];

    if ($("#allowed-projects").children().size() > 0) {
      allowed_projects = $("#allowed-projects").children();

      allowed_projects = allowed_projects.map(function () {
        return $(this).val();
      });
    }

    allowed_projects = $.makeArray(allowed_projects);

    var params = {
      id: user_id,
      master: is_checked_master,
      admin: is_checked_admin,
      allowed_projects: allowed_projects
    };

    if (password && password_confirmation) {
      if (password === password_confirmation) {
        params.password = password;
        params.password_confirmation = password_confirmation;
      }
      else {
        bootstrap_alert(t("users.title"), "Password confirmation does not match Password", "danger");
        return;
      }
    }


    if ($('#mfa-token.hidden').size() === 0) {
      params.mfa_secret_key = $('#mfa-token code').text();
    }

    ajax_users_admin.update(params).done(function (data, status, xhr) {
      bootstrap_alert(t('users.title'), data).done(function () {
        location.reload();
      });
    }).fail(modal_for_ajax_std_error());
  });

  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });




  // kokokara
  var newVM = function (data) {
    data.user.password = "";
    data.user.password_confirmation = "";

    data.selected_allowed_projects = null;
    data.selected_client = null;
    data.selected_projects = null;
    data.projects = null;

    data.update_mfa_key = false;
    data.remove_mfa_key = false;

    return new Vue({
      template: '#user-edit-template',
      data: data,
      methods: {
        get_projects: function () {
          var self = this;
          self.projects = [];
          $.ajax({
            url: '/projects.json',
            data: {client_id: self.selected_client},
            datatype: 'json'
          }).done(function (projects) {
            self.projects = _.map(projects, function (project) {
              var client_name = _.find(self.clients, function (c) {
                return c.value.toString() === self.selected_client.toString();
              }).text;
              return {
                value: project.id,
                text: client_name + " / " + project.name + "["+project.code+"]",
              };
            });
          }).fail(modal_for_ajax_std_error());
        },

        add: function () {
          var self = this;
          _.forEach(this.selected_projects, function (project_id) {
            var project = _.find(self.projects, function (p) {return p.value == project_id;});
            self.allowed_projects.push(project);
            self.allowed_projects = _.uniq(self.allowed_projects, function (p) {return p.value;});
          });
        },

        del: function () {
          var self = this;
          _.forEach(self.selected_allowed_projects, function (project_id) {
            self.allowed_projects = _.reject(self.allowed_projects, function (p) {
              return p.value.toString() === project_id.toString();
            });
          });
        },

        update_mfa: function () { this.update_mfa_key = true; },
        remove_mfa: function () { this.remove_mfa_key = true; }
      },
      ready: function () {
        console.log(this);
      },
    });
  };
  var app;

  var show_edit = function (user_id) {
    var l = new Loader();
    l.$mount("#user-edit");
    if (app) { app.$destroy(); }
    ajax_users_admin.edit({id: user_id}).done(function (data) {
      app = newVM(data);
      l.$destroy();
      app.$mount('#user-edit');
    });
  };

  $(document).on('click', '.edit-user', function (e) {
    e.preventDefault();
    var user_id = $(this).attr('user-id');
    show_edit(user_id);
  });
})();
