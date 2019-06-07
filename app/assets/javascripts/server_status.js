const __extends = (this && this.__extends) || function (d, b) {
  for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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

  static is_inprogress(state) {
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
    const ws = ws_connector('server_status', this.kind);
    ws.onmessage = (msg) => {
      callback(msg.data);
    };
  }
};

const App = (function (_super) {
  __extends(App, _super);
  function App(model, el) {
    _super.call(this);
    this.model = model;
    this._init({
      el,
      data: { state: this.state },
      template: App.TEMPLATE_ID,
      methods: {
        start() {
          const _this = this;
          modal.Confirm(this.model.msgs().title, this.model.msgs().confirm_start).done(() => {
            _this.model.start();
          });
        },
        stop() {
          const _this = this;
          modal.Confirm(this.model.msgs().title, this.model.msgs().confirm_stop).done(() => {
            _this.model.stop();
          });
        },
        status(background) {
          const _this = this;
          this.model.status(background).done((state) => {
            _this.state = state;
            if (background || _this.is_inprogress) {
              _this.model.watch((w_state) => {
                _this.state = w_state;
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
      },
      computed: {
        running() { return this.state === 'running'; },
        stopped() { return this.state === 'stopped'; },
        is_inprogress() { return Server.is_inprogress(this.state); },
        status_text() {
          let res = `${_.capitalize(this.model.kind)} Server `;
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
        },
        tooltip() {
          if (this.is_inprogress) {
            return '';
          }
          return this.model.msgs().tooltip;
        },
      },
      created() {
        console.log(this);
        this.status(true);
      },
    });
  }
  App.TEMPLATE_ID = '#toggle-button-template';
  return App;
}(Vue));
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
