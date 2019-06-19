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
      const d = Object.assign({
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
          get_projects: this.getProjects,
          get_zabbix: this.getZabbix,
          add: this.add,
          del: this.del,
          add_zabbix: this.addZabbix,
          del_zabbix: this.delZabbix,
          update_mfa: this.updateMfa,
          remove_mfa: this.removeMfa,
          submit: this.submit,
        },
        mounted() {
          this.$nextTick(() => {
            self.getZabbix();
          });
        },
      });
    }

    getProjects() {
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: { client_id: this.selected_client },
        dataType: 'json',
      }).done((projects) => {
        this.projects = projects.map((project) => {
          const clientName = this.clients.find(c => c.value === this.selected_client).text;
          return {
            value: project.id,
            text: `${clientName}/${project.name}[${project.code_name}]`,
          };
        });
      }).fail(modal.AlertForAjaxStdError());
    }

    getZabbix() {
      this.zabbix_servers = [];
      $.ajax({
        url: '/zabbix_servers.json',
        dataType: 'json',
      }).done((zabbixServers) => {
        this.zabbix_servers = zabbixServers.map((zabbixServer) => {
          const fqdn = zabbixServer.address.split('/zabbix');
          return {
            value: zabbixServer.id,
            text: `${fqdn[0]}`,
          };
        });
      }).fail(modal.AlertForAjaxStdError());
    }

    add() {
      this.selected_projects.forEach((projectId) => {
        const project = this.projects.find(p => p.value === projectId);
        this.allowed_projects.push(project);
        this.allowed_projects = _.uniq(this.allowed_projects, p => p.value);
      });
    }

    del() {
      this.selected_allowed_projects.forEach((projectId) => {
        this.allowed_projects = this.allowed_projects.filter(p => p.value !== projectId);
      });
    }

    addZabbix() {
      this.selected_zabbix.forEach((zabbixServerId) => {
        const zabbixServer = this.zabbix_servers.find(p => p.value === zabbixServerId);
        this.allowed_zabbix.push(zabbixServer);
        this.allowed_zabbix = _.uniq(this.allowed_zabbix, p => p.value);
      });
    }

    delZabbix() {
      this.selected_allowed_zabbix.forEach((zabbixServerId) => {
        this.allowed_zabbix = this.allowed_projects.filter(p => p.value !== zabbixServerId);
      });
    }

    updateMfa() {
      this.update_mfa_key = true;
    }

    removeMfa() {
      this.remove_mfa_key = true;
    }

    submit() {
      const body = {};
      body.allowed_projects = this.allowed_projects.map(p => p.value);
      body.allowed_zabbix = this.allowed_zabbix.map(p => p.value);
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
          showEdit(this.user.id);
        });
      }).fail(modal.AlertForAjaxStdError(() => {
        showEdit(this.user.id);
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
