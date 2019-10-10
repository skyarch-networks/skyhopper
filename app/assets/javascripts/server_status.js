const modal = require('./modal');

const Server = class Server {
  constructor(kind) {
    this.kind = kind;
    this.params = { kind };
    this.ajax = new AjaxSet.Resources('server_status');
    this.ajax.add_member('start', 'POST', 'kind');
    this.ajax.add_member('stop', 'POST', 'kind');
    this.ajax.add_member('status', 'POST', 'kind');
  }

  static isInprogress(state) {
    return !(state === 'running' || state === 'stopped');
  }

  msgs() {
    return t(`js.server_status.${this.kind}`);
  }

  start() {
    this.ajax.start(this.params);
  }

  stop() {
    this.ajax.stop(this.params);
  }

  status(background) {
    const p = Object.assign({ background }, this.params);
    return this.ajax.status(p);
  }

  watch(callback) {
    const ws = wsConnector('server_status', this.kind);
    ws.onmessage = (msg) => {
      callback(msg.data);
    };
  }
};

const App = class App extends Vue {
  constructor(model, el) {
    super();
    this.model = model;
    this._init({
      el,
      data: { state: this.state },
      template: App.TEMPLATE_ID,
      methods: {
        start() {
          modal.Confirm(this.model.msgs().title, this.model.msgs().confirm_start).done(() => {
            this.model.start();
          });
        },
        stop() {
          modal.Confirm(this.model.msgs().title, this.model.msgs().confirm_stop).done(() => {
            this.model.stop();
          });
        },
        status(background) {
          this.model.status(background).done((state) => {
            this.state = state;
            if (background || this.is_inprogress) {
              this.model.watch((wState) => {
                this.state = wState;
              });
            }
          });
        },
        toggle() {
          if (this.running) {
            this.stop();
          } else if (this.stopped) {
            this.start();
          }
        },
        serviceName() {
          const { kind } = this.model;
          return kind.charAt(0).toUpperCase() + kind.slice(1);
        },
      },
      computed: {
        running() { return this.state === 'running'; },
        stopped() { return this.state === 'stopped'; },
        is_inprogress() { return Server.isInprogress(this.state); },
        status_text() {
          let res = `${this.serviceName()} Server `;
          if (this.running) {
            res += `is ${this.state}.`;
          } else if (this.stopped) {
            res += `was ${this.state}.`;
          } else if (this.is_inprogress) {
            res += `${this.state}...`;
          }
          return res;
        },
        btn_class() {
          if (this.running) {
            return 'btn-success';
          }
          if (this.stopped) {
            return 'btn-default';
          } if (this.is_inprogress) {
            return 'btn-warning';
          }
          return undefined;
        },
        tooltip() {
          if (this.is_inprogress) {
            return '';
          }
          return this.model.msgs().tooltip;
        },
      },
      created() {
        this.status(true);
      },
    });
  }
};
App.TEMPLATE_ID = '#toggle-button-template';

function Build(kind) {
  const el = document.createElement('div');
  const parent = document.querySelector(App.TEMPLATE_ID).parentElement;
  parent.appendChild(el);
  parent.appendChild(document.createTextNode('\n'));
  new App(new Server(kind), el);
}
function Available() {
  return !!document.querySelector(App.TEMPLATE_ID);
}
function Do() {
  if (!Available()) {
    return;
  }
  Build('zabbix');
}
exports.Do = Do;
