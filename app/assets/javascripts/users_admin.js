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
        remove_mfa: function () { this.remove_mfa_key = true; },

        submit: function () {
          var self = this;
          var body = {};
          body.allowed_projects = _.map(self.allowed_projects, function(p){return p.value;});
          body.master = self.user.master;
          body.admin = self.user.admin;
          if (self.update_mfa_key) {
            body.mfa_secret_key = self.mfa_key;
          }
          body.remove_mfa_key = self.remove_mfa_key;

          var password = self.user.password;
          var password_confirmation = self.user.password_confirmation;
          if (password && password_confirmation) {
            if (password === password_confirmation) {
              body.password = password;
              body.password_confirmation = password_confirmation;
            }
            else {
              bootstrap_alert(t("users.title"), "Password confirmation does not match Password", "danger");
              return;
            }
          }

          ajax_users_admin.update({
            id: self.user.id,
            body: JSON.stringify(body),
          }).done(function (data) {
            bootstrap_alert(t('users.title'), data, true).done(function () {
              show_edit(self.user.id);
            });
          }).fail(modal_for_ajax_std_error(function () {
            show_edit(self.user.id);
          }));
        },
      },

      ready: function () { console.log(this); },
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
    }).fail(modal_for_ajax_std_error(function () {
      l.$destroy();
    }));
  };


  $(document).on('click', '.edit-user', function (e) {
    e.preventDefault();
    highlight_user_row($(this).parent().parent());
    var user_id = $(this).attr('user-id');
    show_edit(user_id);
  });

  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });
})();
