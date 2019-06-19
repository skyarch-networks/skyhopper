const modal = require('./modal');
require('./user_index');

{
  const ajax = new AjaxSet.Resources('users_admin');
  ajax.add_collection('sync_zabbix', 'PUT');

  function syncZabbix(btn) {
    const f = () => {
      const reload = () => {
        btn.prop('disabled', false);
        window.location.reload();
      };
      btn.prop('disabled', true);
      const frag = $(document.createDocumentFragment());
      const p = $('<p>');
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      ajax.sync_zabbix().done((data) => {
        modal.Alert(t('users.title'), data).done(reload);
      }).fail(modal.AlertForAjaxStdError(reload));
    };
    modal.Confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  }

  function showEdit(userId) {
    const l = new Loader();
    document.getElementById('user-edit').appendChild(l.$mount().$el);
    if (app) {
      document.getElementById('user-edit').removeChild(app.$mount().$el);
    }
    ajax.edit({ id: userId }).done((data) => {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
      app = new App(data);
      document.getElementById('user-edit').appendChild(app.$mount().$el);
    }).fail(modal.AlertForAjaxStdError(() => {
      document.getElementById('user-edit').removeChild(l.$mount().$el);
    }));
  }

  const App = class App extends Vue {
    constructor(data) {
      super();
      const self = this;
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
            self.get_zabbix();
          });
        },
      });
    }

    get_projects() {
      const self = this;
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: { client_id: this.selected_client },
        dataType: 'json',
      }).done((projects) => {
        self.projects = _.map(projects, (project) => {
          const clientName = _.find(self.clients, c => c.value === self.selected_client).text;
          return {
            value: project.id,
            text: `${clientName}/${project.name}[${project.code_name}]`,
          };
        });
      }).fail(modal.AlertForAjaxStdError());
    }

    get_zabbix() {
      const self = this;
      this.zabbix_servers = [];
      $.ajax({
        url: '/zabbix_servers.json',
        dataType: 'json',
      }).done((zabbixServers) => {
        self.zabbix_servers = _.map(zabbixServers, (zabbixServer) => {
          const fqdn = zabbixServer.address.split('/zabbix');
          return {
            value: zabbixServer.id,
            text: `${fqdn[0]}`,
          };
        });
      }).fail(modal.AlertForAjaxStdError());
    }

    add() {
      const self = this;
      _.forEach(this.selected_projects, (projectId) => {
        const project = _.find(self.projects, p => p.value === projectId);
        self.allowed_projects.push(project);
        self.allowed_projects = _.uniq(self.allowed_projects, p => p.value);
      });
    }

    del() {
      const self = this;
      _.forEach(this.selected_allowed_projects, (projectId) => {
        self.allowed_projects = _.reject(self.allowed_projects, p => p.value === projectId);
      });
    }

    add_zabbix() {
      const self = this;
      _.forEach(this.selected_zabbix, (zabbixServerId) => {
        const zabbixServer = _.find(self.zabbix_servers, p => p.value === zabbixServerId);
        self.allowed_zabbix.push(zabbixServer);
        self.allowed_zabbix = _.uniq(self.allowed_zabbix, p => p.value);
      });
    }

    del_zabbix() {
      const self = this;
      _.forEach(this.selected_allowed_zabbix, (zabbixServerId) => {
        self.allowed_zabbix = _.reject(self.allowed_projects, p => p.value === zabbixServerId);
      });
    }

    update_mfa() {
      this.update_mfa_key = true;
    }

    remove_mfa() {
      this.remove_mfa_key = true;
    }

    submit() {
      const self = this;
      const body = {};
      body.allowed_projects = _.map(this.allowed_projects, p => p.value);
      body.allowed_zabbix = _.map(this.allowed_zabbix, p => p.value);
      body.master = this.user.master;
      body.admin = this.user.admin;
      if (this.update_mfa_key) {
        body.mfa_secret_key = this.mfa_key;
      }
      body.remove_mfa_key = this.remove_mfa_key;
      const { password } = this.user;
      const passwordConfirmation = this.user.password_confirmation;
      if (password && passwordConfirmation) {
        if (password === passwordConfirmation) {
          body.password = password;
          body.password_confirmation = passwordConfirmation;
        } else {
          modal.Alert(t('users.title'), 'Password confirmation does not match Password', 'danger');
          return;
        }
      }
      ajax.update({
        id: this.user.id,
        body: JSON.stringify(body),
      }).done((data) => {
        modal.Alert(t('users.title'), data).done(() => {
          showEdit(self.user.id);
        });
      }).fail(modal.AlertForAjaxStdError(() => {
        showEdit(self.user.id);
      }));
    }
  };

  let app;

  $(document).on('click', '.edit-user', function editUserClickHandler(e) {
    e.preventDefault();
    const userId = $(this).attr('user-id');
    showEdit(parseInt(userId, 10));
  });
  $(document).on('click', '#sync_zabbix', function syncZabbixClickHandler() {
    syncZabbix($(this));
  });
}
