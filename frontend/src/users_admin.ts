/// <reference path="../declares.d.ts" />
//=require user_index

namespace UsersAdmin {
  const ajax = new AjaxSet.Resources('users_admin');
  ajax.add_collection('sync_zabbix', 'PUT');

  function highlight_user_row(selected_user: JQuery): void {
    $(".user-row").removeClass("info");
    selected_user.addClass("info");
  }

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
        bootstrap_alert(t('users.title'), data).done(reload);
      }).fail(modal_for_ajax_std_error(reload));
    };

    bootstrap_confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  }

  interface ProjectResp {
    id:   number;
    name: string;
    code: string;
    url:  string;
  }

  interface VueOption {
    value: number;
    text:  string;
  }

  interface UpdateRequestBody {
    allowed_projects: number[];
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

    private update_mfa_key: boolean;
    private remove_mfa_key: boolean;
    private mfa_key:    string;
    private mfa_qrcode: string;

    constructor(data: any) {
      this.update_mfa_key = false;
      this.remove_mfa_key = false;
      this.user = { password: "", password_confirmation: "", };
      this.selected_allowed_projects = [];
      this.selected_projects = [];
      this.projects = [];

      const d = _.merge({
        user:                      this.user,
        selected_allowed_projects: this.selected_allowed_projects,
        selected_client:           this.selected_client,
        selected_projects:         this.selected_projects,
        projects:                  this.projects,
        update_mfa_key:            this.update_mfa_key,
        remove_mfa_key:            this.remove_mfa_key,
      }, data);

      super();
      this._init({
        template: '#user-edit-template',
        data: d,
        methods: {
          get_projects: this.get_projects,
          add:          this.add,
          del:          this.del,
          update_mfa:   this.update_mfa,
          remove_mfa:   this.remove_mfa,
          submit:       this.submit,
        },
        ready: () => {console.log(this); },
      });
    }

    //  === Instance Methods

    get_projects(): void {
      this.projects = [];
      $.ajax({
        url: '/projects.json',
        data: {client_id: this.selected_client},
        datatype: 'json'
      }).done((projects: ProjectResp[]) => {
        this.projects = _.map(projects, (project) => {
          const client_name = _.find(this.clients, c => c.value === this.selected_client).text;

          return {
            value: project.id,
            text: `${client_name}/${project.name}[${project.code}]`,
          };
        });
      }).fail(modal_for_ajax_std_error());
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

    update_mfa(): void {this.update_mfa_key = true; }
    remove_mfa(): void {this.remove_mfa_key = true; }

    submit(): void {
      const body = <UpdateRequestBody>{};
      body.allowed_projects = _.map(this.allowed_projects, p =>  p.value);
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
          bootstrap_alert(t("users.title"), "Password confirmation does not match Password", "danger");
          return;
        }
      }

      ajax.update({
        id: this.user.id,
        body: JSON.stringify(body),
      }).done((data) => {
        bootstrap_alert(t('users.title'), data).done(() => {
          show_edit(this.user.id);
        });
      }).fail(modal_for_ajax_std_error(() => {
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
    }).fail(modal_for_ajax_std_error(() => {
      l.$remove();
    }));
  }

  $(document).on('click', '.edit-user', function (e) {
    e.preventDefault();
    highlight_user_row($(this).parent().parent());
    const user_id = $(this).attr('user-id');
    show_edit(parseInt(user_id));
  });

  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });
}
