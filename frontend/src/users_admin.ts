//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


/// <reference path="../declares.d.ts" />

import {Confirm, Alert, AlertForAjaxStdError} from './modal';
import 'user_index';

namespace UsersAdmin {
  const ajax = new AjaxSet.Resources('users_admin');
  ajax.add_collection('sync_zabbix', 'PUT');


  function sync_zabbix(btn: JQuery): void {
    const f = function () {
      const reload = (): void => {
        // ここでdisabled を消さないと、何故かリロードしてもdisabledがついたままになる(FireFox で確認)
        btn.prop('disabled', false);
        location.reload();
      };

      btn.prop('disabled', true);
      const frag = $(document.createDocumentFragment());
      const p = $("<p>");
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      (<any>ajax).sync_zabbix().done((data: string) => {
        Alert(t('users.title'), data).done(reload);
      }).fail(AlertForAjaxStdError(reload));
    };

    Confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  }

  interface ProjectResp {
    id:   number;
    name: string;
    code_name: string;
    url:  string;
  }

  interface ZabbixResp {
    id: number;
    address: string;
    details: string;
  }

  interface VueOption {
    value: number;
    text:  string;
  }

  interface UpdateRequestBody {
    allowed_projects: number[];
    allowed_zabbix: number[];
    master: boolean;
    admin:  boolean;
    mfa_secret_key: string;
    remove_mfa_key: boolean;
    password: string;
    password_confirmation: string;
  }

  class App extends Vue {
    private user: any;

    private selected_client: number;
    private clients: VueOption[];

    private selected_projects: number[];
    private projects: VueOption[];

    private selected_allowed_projects: number[];
    private allowed_projects: VueOption[];

    private selected_allowed_zabbix: number[];
    private allowed_zabbix: VueOption[];

    private zabbix_servers: VueOption[];
    private selected_zabbix: number[];

    private update_mfa_key: boolean;
    private remove_mfa_key: boolean;
    private mfa_key:    string;
    private mfa_qrcode: string;

    constructor(data: any) {
      super();
      this.update_mfa_key = false;
      this.remove_mfa_key = false;
      this.user = { password: "", password_confirmation: "", };
      this.selected_allowed_projects = [];
      this.selected_projects = [];
      this.projects = [];

      this.selected_allowed_zabbix = [];
      this.selected_zabbix = [];
      this.zabbix_servers = [];

      const d = _.merge({
        user:                      this.user,
        selected_allowed_projects: this.selected_allowed_projects,
        selected_client:           this.selected_client,
        selected_projects:         this.selected_projects,
        projects:                  this.projects,
        update_mfa_key:            this.update_mfa_key,
        remove_mfa_key:            this.remove_mfa_key,
        zabbix_servers:            this.zabbix_servers,
        selected_zabbix:           this.selected_zabbix,
        selected_allowed_zabbix:   this.selected_allowed_zabbix
      }, data);

      this._init({
        template: '#user-edit-template',
        data: d,
        methods: {
          get_projects: this.get_projects,
          get_zabbix:   this.get_zabbix,
          add:          this.add,
          del:          this.del,
          add_zabbix:   this.add_zabbix,
          del_zabbix:   this.del_zabbix,
          update_mfa:   this.update_mfa,
          remove_mfa:   this.remove_mfa,
          submit:       this.submit,
        },
        ready: () => {
          console.log(this);
          this.get_zabbix();
        },
      });
    }

    //  === Instance Methods

    get_projects(): void {
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: {client_id: this.selected_client},
        dataType: 'json',
      }).done((projects: ProjectResp[]) => {
        this.projects = _.map(projects, (project) => {
          const client_name = _.find(this.clients, c => c.value === this.selected_client).text;

          return {
            value: project.id,
            text: `${client_name}/${project.name}[${project.code_name}]`,
          };
        });
      }).fail(AlertForAjaxStdError());
    }

    get_zabbix(): void  {
      this.zabbix_servers = [];
      $.ajax({
        url: '/zabbix_servers.json',
        dataType: 'json',
      }).done((zabbix_servers: ZabbixResp[]) => {
        this.zabbix_servers = _.map(zabbix_servers, (zabbix_server) => {
          const fqdn = zabbix_server.address.split("/zabbix");
          return{
            value: zabbix_server.id,
            text: `${fqdn[0]}`,
          };
        });
      }).fail(AlertForAjaxStdError());
    }

    add(): void {
      _.forEach(this.selected_projects, (project_id) => {
        const project = _.find(this.projects, p => p.value === project_id);
        this.allowed_projects.push(project);
        this.allowed_projects = _.uniq(this.allowed_projects, p => p.value);
      });
    }

    del(): void {
      _.forEach(this.selected_allowed_projects, (project_id) => {
        this.allowed_projects = _.reject(this.allowed_projects, (p) => {
          return p.value === project_id;
        });
      });
    }

    add_zabbix(): void  {
      _.forEach(this.selected_zabbix, (zabbix_server_id) => {
        const zabbix_server = _.find(this.zabbix_servers, p => p.value === zabbix_server_id);
        this.allowed_zabbix.push(zabbix_server);
        this.allowed_zabbix = _.uniq(this.allowed_zabbix, p => p.value);
      });
    }

    del_zabbix(): void  {
      _.forEach(this.selected_allowed_zabbix, (zabbix_server_id) => {
        this.allowed_zabbix = _.reject(this.allowed_projects, (p) => {
          return p.value === zabbix_server_id;
        });
      });
    }

    update_mfa(): void {this.update_mfa_key = true; }
    remove_mfa(): void {this.remove_mfa_key = true; }

    submit(): void {
      const body = <UpdateRequestBody>{};
      body.allowed_projects = _.map(this.allowed_projects, p =>  p.value);
      body.allowed_zabbix   = _.map(this.allowed_zabbix, p => p.value);
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
          Alert(t("users.title"), "Password confirmation does not match Password", "danger");
          return;
        }
      }

      ajax.update({
        id: this.user.id,
        body: JSON.stringify(body),
      }).done((data) => {
        Alert(t('users.title'), data).done(() => {
          show_edit(this.user.id);
        });
      }).fail(AlertForAjaxStdError(() => {
        show_edit(this.user.id);
      }));
    }
  }
  let app: App;

  function show_edit(user_id: number) {
    const l = new Loader();
    l.$mount().$appendTo('#user-edit');
    if (app) { app.$remove(); }
    ajax.edit({id: user_id}).done((data: any) => {
      l.$remove();
      app = new App(data);
      app.$mount().$appendTo('#user-edit');
    }).fail(AlertForAjaxStdError(() => {
      l.$remove();
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
}
