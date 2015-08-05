/// <reference path="../declares.d.ts" />

module ServerStatus {
  const TEMPLATE_ID = '#toggle-button-template';

  class Server {
    // Parameter for Ajax.
    private params: {kind: string};

    constructor(public kind: string) {
      this.params = {kind: kind};
    }

    static ajax = new AjaxSet.Resources('server_status');

    /**
     * サーバーが起動、もしくは停止しようとしている場合に true を返す。
     * @method is_inprogress
     * @param {String} state ステータスを表す文字列
     * @return {Boolean}
     */
     static is_inprogress(state: string): boolean {
       return !(state === 'running' || state === 'stopped');
     }


     /// --- Instance Methods.

    /**
     * @method msgs
     * @return {Object} I18n した結果を複数格納した辞書
     */
    msgs(): any {
      return t('js.server_status.' + this.kind);
    }

    /**
     * Start server.
     * @method start
     */
    start(): void {
      (<any>Server.ajax).start(this.params);
    }

    /**
     * Stop server.
     * @method stop
     */
     stop(): void {
       (<any>Server.ajax).stop(this.params);
     }

    /**
     * Get server status.
     * @method status
     * @param {Boolean} background true ならばバックグラウンドでステータスをポーリングする
     * @return {$.Deferred} .done で callback にステータスを渡して実行
     */
     status(background: boolean): JQueryDeferred<string> {
       const p = _.merge({background: background}, this.params);

       return (<any>Server.ajax).status(p);
     }

    /**
     * ステータスの変化を WebSocket で待ち受け、callback にステータスを渡す。
     * @method watch
     * @param {function(Stirng)}
     */
    watch(callback: (text: string) => void) {
      const ws = ws_connector('server_status', this.kind);
      ws.onmessage = function (msg) {
        if (msg.data === 'finish_ws') {
          ws.close();
          return;
        }
        callback(msg.data);
      };
    };
  }
  Server.ajax.add_member('start',  'POST', 'kind');
  Server.ajax.add_member('stop',   'POST', 'kind');
  Server.ajax.add_member('status', 'POST', 'kind');



  // View Model Factory.
  const new_toggle_button = function (model: Server) {
    return new Vue({
      template: TEMPLATE_ID,
      data: {state: ""},

      methods: {
        // confirm and start server.
        start: function (): void {
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_start).done(() => {
            model.start();
            this.status(true);
          });
        },

        // confirm and stop server.
        stop: function (): void {
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_stop).done(() => {
            model.stop();
            this.status(true);
          });
        },

        // Update ViewModel state, and watch sate change.
        status: function (background: boolean): void {
          model.status(background).done((state: string) => {
            this.state = state;
            if (background || this.is_inprogress) {
              model.watch((w_state: string) => {
                this.state = w_state;
              });
            }
          });
        },

        // toggle server state.
        toggle: function (): void {
          this.$event.preventDefault();
          if (this.running) {
            this.stop();
          } else if (this.stopped) {
            this.start();
          }
        },
      },
      computed: {
        running:       function () { return this.state === 'running'; },
        stopped:       function () { return this.state === 'stopped'; },
        is_inprogress: function () { return Server.is_inprogress(this.state); },

        status_text: function (): string {
          let res = _.capitalize(model.kind) + ' Server ';
          if (this.running) {
            res += 'is ' + this.state + '.';
          } else if (this.stopped) {
            res += 'was ' + this.state + '.';
          } else if (this.is_inprogress) {
            res += this.state + '...';
          }
          return res;
        },

        btn_class: function (): string {
          if (this.running) {
            return 'btn-success';
          } else if (this.stopped) {
            return 'btn-default';
          } else if (this.is_inprogress) {
            return 'btn-warning';
          }
        },

        tooltip: function (): string {
          if (this.is_inprogress) { return ""; }
          return model.msgs().tooltip;
        },
      },
      created: function () {
        this.status();
      },
    });
  };

  export const build = function (kind: string): void {
    const vm = new_toggle_button(new Server(kind));
    const e = document.createElement('div');
    vm.$mount(e);
    vm.$after(TEMPLATE_ID);
  };

  export const available = function (): boolean {
    return !!document.querySelector(TEMPLATE_ID);
  };
}

(function () {
  if (!ServerStatus.available()) { return; }

  ServerStatus.build('zabbix');
  ServerStatus.build('chef');
})();
