

const __extends = (this && this.__extends) || function (d, b) {
  for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

  function __() {
    this.constructor = d;
  }

  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
const modal_1 = require('./modal');
require('user_index');

let UsersAdmin;
(function (UsersAdmin) {
  const ajax = new AjaxSet.Resources('users_admin');
  ajax.add_collection('sync_zabbix', 'PUT');

  function sync_zabbix(btn) {
    const f = function () {
      const reload = function () {
        btn.prop('disabled', false);
        location.reload();
      };
      btn.prop('disabled', true);
      const frag = $(document.createDocumentFragment());
      const p = $('<p>');
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      ajax.sync_zabbix().done((data) => {
        modal_1.Alert(t('users.title'), data).done(reload);
      }).fail(modal_1.AlertForAjaxStdError(reload));
    };
    modal_1.Confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  }

  const App = (function (_super) {
    __extends(App, _super);

    function App(data) {
      const _this = this;
      _super.call(this);
      this.update_mfa_key = false;
      this.remove_mfa_key = false;
      this.user = { password: '', password_confirmation: '' };
      this.selected_allowed_projects = [];
      this.selected_projects = [];
      this.projects = [];
      this.selected_allowed_zabbix = [];
      this.selected_zabbix = [];
      this.zabbix_servers = [];
      const d = _.merge({
        user: this.user,
        selected_allowed_projects: this.selected_allowed_projects,
        selected_client: this.selected_client,
        selected_projects: this.selected_projects,
        projects: this.projects,
        update_mfa_key: this.update_mfa_key,
        remove_mfa_key: this.remove_mfa_key,
        zabbix_servers: this.zabbix_servers,
        selected_zabbix: this.selected_zabbix,
        selected_allowed_zabbix: this.selected_allowed_zabbix,
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
        mounted() {
          this.$nextTick(() => {
            console.log(_this);
            _this.get_zabbix();
          });
        },
      });
    }

    App.prototype.get_projects = function () {
      const _this = this;
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: { client_id: this.selected_client },
        dataType: 'json',
      }).done((projects) => {
        _this.projects = _.map(projects, (project) => {
          const client_name = _.find(_this.clients, c => c.value === _this.selected_client).text;
          return {
            value: project.id,
            text: `${client_name}/${project.name}[${project.code_name}]`,
          };
        });
      }).fail(modal_1.AlertForAjaxStdError());
    };
    App.prototype.get_zabbix = function () {
      const _this = this;
      this.zabbix_servers = [];
      $.ajax({
        url: '/zabbix_servers.json',
        dataType: 'json',
      }).done((zabbix_servers) => {
        _this.zabbix_servers = _.map(zabbix_servers, (zabbix_server) => {
          const fqdn = zabbix_server.address.split('/zabbix');
          return {
            value: zabbix_server.id,
            text: `${fqdn[0]}`,
          };
        });
      }).fail(modal_1.AlertForAjaxStdError());
    };
    App.prototype.add = function () {
      const _this = this;
      _.forEach(this.selected_projects, (project_id) => {
        const project = _.find(_this.projects, p => p.value === project_id);
        _this.allowed_projects.push(project);
        _this.allowed_projects = _.uniq(_this.allowed_projects, p => p.value);
      });
    };
    App.prototype.del = function () {
      const _this = this;
      _.forEach(this.selected_allowed_projects, (project_id) => {
        _this.allowed_projects = _.reject(_this.allowed_projects, p => p.value === project_id);
      });
    };
    App.prototype.add_zabbix = function () {
      const _this = this;
      _.forEach(this.selected_zabbix, (zabbix_server_id) => {
        const zabbix_server = _.find(_this.zabbix_servers, p => p.value === zabbix_server_id);
        _this.allowed_zabbix.push(zabbix_server);
        _this.allowed_zabbix = _.uniq(_this.allowed_zabbix, p => p.value);
      });
    };
    App.prototype.del_zabbix = function () {
      const _this = this;
      _.forEach(this.selected_allowed_zabbix, (zabbix_server_id) => {
        _this.allowed_zabbix = _.reject(_this.allowed_projects, p => p.value === zabbix_server_id);
      });
    };
    App.prototype.update_mfa = function () {
      this.update_mfa_key = true;
    };
    App.prototype.remove_mfa = function () {
      this.remove_mfa_key = true;
    };
    App.prototype.submit = function () {
      const _this = this;
      const body = {};
      body.allowed_projects = _.map(this.allowed_projects, p => p.value);
      body.allowed_zabbix = _.map(this.allowed_zabbix, p => p.value);
      body.master = this.user.master;
      body.admin = this.user.admin;
      if (this.update_mfa_key) {
        body.mfa_secret_key = this.mfa_key;
      }
      body.remove_mfa_key = this.remove_mfa_key;
      const password = this.user.password;
      const password_confirmation = this.user.password_confirmation;
      if (password && password_confirmation) {
        if (password === password_confirmation) {
          body.password = password;
          body.password_confirmation = password_confirmation;
        } else {
          modal_1.Alert(t('users.title'), 'Password confirmation does not match Password', 'danger');
          return;
        }
      }
      ajax.update({
        id: this.user.id,
        body: JSON.stringify(body),
      }).done((data) => {
        modal_1.Alert(t('users.title'), data).done(() => {
          show_edit(_this.user.id);
        });
      }).fail(modal_1.AlertForAjaxStdError(() => {
        show_edit(_this.user.id);
      }));
    };
    return App;
  }(Vue));
  let app;

  function show_edit(user_id) {
    const l = new Loader();
    document.getElementById('user-edit').appendChild(l.$mount().$el);
    if (app) {
      document.getElementById('user-edit').removeChild(app.$mount().$el);
    }
    ajax.edit({ id: user_id }).done((data) => {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
      app = new App(data);
      document.getElementById('user-edit').appendChild(app.$mount().$el);
    }).fail(modal_1.AlertForAjaxStdError(() => {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
    }));
  }

  $(document).on('click', '.edit-user', function (e) {
    e.preventDefault();
    const user_id = $(this).attr('user-id');
    show_edit(parseInt(user_id));
  });
  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });
}(UsersAdmin || (UsersAdmin = {})));
