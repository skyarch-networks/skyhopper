"use strict";
var __extends = (this && this.__extends) || function (d, b) {
  for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

  function __() {
    this.constructor = d;
  }

  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var modal_1 = require('./modal');
require('user_index');
var UsersAdmin;
(function (UsersAdmin) {
  var ajax = new AjaxSet.Resources('users_admin');
  ajax.add_collection('sync_zabbix', 'PUT');

  function sync_zabbix(btn) {
    var f = function () {
      var reload = function () {
        btn.prop('disabled', false);
        location.reload();
      };
      btn.prop('disabled', true);
      var frag = $(document.createDocumentFragment());
      var p = $("<p>");
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      ajax.sync_zabbix().done(function (data) {
        modal_1.Alert(t('users.title'), data).done(reload);
      }).fail(modal_1.AlertForAjaxStdError(reload));
    };
    modal_1.Confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  }

  var App = (function (_super) {
    __extends(App, _super);

    function App(data) {
      var _this = this;
      _super.call(this);
      this.update_mfa_key = false;
      this.remove_mfa_key = false;
      this.user = {password: "", password_confirmation: "",};
      this.selected_allowed_projects = [];
      this.selected_projects = [];
      this.projects = [];
      this.selected_allowed_zabbix = [];
      this.selected_zabbix = [];
      this.zabbix_servers = [];
      var d = _.merge({
        user: this.user,
        selected_allowed_projects: this.selected_allowed_projects,
        selected_client: this.selected_client,
        selected_projects: this.selected_projects,
        projects: this.projects,
        update_mfa_key: this.update_mfa_key,
        remove_mfa_key: this.remove_mfa_key,
        zabbix_servers: this.zabbix_servers,
        selected_zabbix: this.selected_zabbix,
        selected_allowed_zabbix: this.selected_allowed_zabbix
      }, data);
      this._init({
        template: '#user-edit-template',
        data: d,
        methods: {
          get_projects: this.get_projects,
          get_zabbix: this.get_zabbix,
          add: this.add,
          del: this.del,
          add_zabbix: this.add_zabbix,
          del_zabbix: this.del_zabbix,
          update_mfa: this.update_mfa,
          remove_mfa: this.remove_mfa,
          submit: this.submit,
        },
        mounted: function () {
          this.$nextTick(function () {
            console.log(_this);
            _this.get_zabbix();
          })
        },
      });
    }

    App.prototype.get_projects = function () {
      var _this = this;
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: {client_id: this.selected_client},
        dataType: 'json',
      }).done(function (projects) {
        _this.projects = _.map(projects, function (project) {
          var client_name = _.find(_this.clients, function (c) {
            return c.value === _this.selected_client;
          }).text;
          return {
            value: project.id,
            text: client_name + "/" + project.name + "[" + project.code_name + "]",
          };
        });
      }).fail(modal_1.AlertForAjaxStdError());
    };
    App.prototype.get_zabbix = function () {
      var _this = this;
      this.zabbix_servers = [];
      $.ajax({
        url: '/zabbix_servers.json',
        dataType: 'json',
      }).done(function (zabbix_servers) {
        _this.zabbix_servers = _.map(zabbix_servers, function (zabbix_server) {
          var fqdn = zabbix_server.address.split("/zabbix");
          return {
            value: zabbix_server.id,
            text: "" + fqdn[0],
          };
        });
      }).fail(modal_1.AlertForAjaxStdError());
    };
    App.prototype.add = function () {
      var _this = this;
      _.forEach(this.selected_projects, function (project_id) {
        var project = _.find(_this.projects, function (p) {
          return p.value === project_id;
        });
        _this.allowed_projects.push(project);
        _this.allowed_projects = _.uniq(_this.allowed_projects, function (p) {
          return p.value;
        });
      });
    };
    App.prototype.del = function () {
      var _this = this;
      _.forEach(this.selected_allowed_projects, function (project_id) {
        _this.allowed_projects = _.reject(_this.allowed_projects, function (p) {
          return p.value === project_id;
        });
      });
    };
    App.prototype.add_zabbix = function () {
      var _this = this;
      _.forEach(this.selected_zabbix, function (zabbix_server_id) {
        var zabbix_server = _.find(_this.zabbix_servers, function (p) {
          return p.value === zabbix_server_id;
        });
        _this.allowed_zabbix.push(zabbix_server);
        _this.allowed_zabbix = _.uniq(_this.allowed_zabbix, function (p) {
          return p.value;
        });
      });
    };
    App.prototype.del_zabbix = function () {
      var _this = this;
      _.forEach(this.selected_allowed_zabbix, function (zabbix_server_id) {
        _this.allowed_zabbix = _.reject(_this.allowed_projects, function (p) {
          return p.value === zabbix_server_id;
        });
      });
    };
    App.prototype.update_mfa = function () {
      this.update_mfa_key = true;
    };
    App.prototype.remove_mfa = function () {
      this.remove_mfa_key = true;
    };
    App.prototype.submit = function () {
      var _this = this;
      var body = {};
      body.allowed_projects = _.map(this.allowed_projects, function (p) {
        return p.value;
      });
      body.allowed_zabbix = _.map(this.allowed_zabbix, function (p) {
        return p.value;
      });
      body.master = this.user.master;
      body.admin = this.user.admin;
      if (this.update_mfa_key) {
        body.mfa_secret_key = this.mfa_key;
      }
      body.remove_mfa_key = this.remove_mfa_key;
      var password = this.user.password;
      var password_confirmation = this.user.password_confirmation;
      if (password && password_confirmation) {
        if (password === password_confirmation) {
          body.password = password;
          body.password_confirmation = password_confirmation;
        } else {
          modal_1.Alert(t("users.title"), "Password confirmation does not match Password", "danger");
          return;
        }
      }
      ajax.update({
        id: this.user.id,
        body: JSON.stringify(body),
      }).done(function (data) {
        modal_1.Alert(t('users.title'), data).done(function () {
          show_edit(_this.user.id);
        });
      }).fail(modal_1.AlertForAjaxStdError(function () {
        show_edit(_this.user.id);
      }));
    };
    return App;
  }(Vue));
  var app;

  function show_edit(user_id) {
    var l = new Loader();
    document.getElementById('user-edit').appendChild(l.$mount().$el);
    if (app) {
      document.getElementById('user-edit').removeChild(app.$mount().$el);
    }
    ajax.edit({id: user_id}).done(function (data) {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
      app = new App(data);
      document.getElementById('user-edit').appendChild(app.$mount().$el);
    }).fail(modal_1.AlertForAjaxStdError(function () {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
    }));
  }

  $(document).on('click', '.edit-user', function (e) {
    e.preventDefault();
    var user_id = $(this).attr('user-id');
    show_edit(parseInt(user_id));
  });
  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });
})(UsersAdmin || (UsersAdmin = {}));
