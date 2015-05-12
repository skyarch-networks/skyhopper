//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  "use strict";

  var TEMPLATE_ID = '#toggle-button-template';
  if (!document.querySelector(TEMPLATE_ID)) {
    // when not logined
    return;
  }

  /**
   * This is a model.
   *
   * @class ServerStatus
   * @constructor
   */
  var ServerStatus = function (kind) {
    var ajax = new AjaxSet.Resources('server_status');
    ajax.add_member('start',  'POST', 'kind');
    ajax.add_member('stop',   'POST', 'kind');
    ajax.add_member('status', 'POST', 'kind');

    this.kind = kind;

    /**
     * @method msgs
     * @return {Object} I18n した結果を複数格納した辞書
     */
    this.msgs = function () {
      return t('js.server_status.' + kind);
    };

    // ajax 用のパラメータ
    var params = {kind: kind};

    /**
     * Start server.
     * @method start
     */
    this.start = function () {
      ajax.start(params);
    };

    /**
     * Stop server.
     * @method stop
     */
    this.stop = function () {
      ajax.stop(params);
    };

    /**
     * Get server status.
     * @method status
     * @param {Boolean} background true ならばバックグラウンドでステータスをポーリングする
     * @return {$.Deferred} .done で callback にステータスを渡して実行
     */
    this.status = function (background) {
      var p = _.clone(params);
      if (background) {
        p.background = true;
      }
      return ajax.status(p);
    };

    /**
     * サーバーが起動、もしくは停止しようとしている場合に true を返す。
     * @method is_inprogress
     * @param {String} state ステータスを表す文字列
     * @return {Boolean}
     */
    this.is_inprogress = function (state) {
      return !(state === 'running' || state === 'stopped');
    };

    /**
     * ステータスの変化を WebSocket で待ち受け、callback にステータスを渡す。
     * @method watch
     * @param {function(Stirng)}
     */
    this.watch = function (callback) {
      var ws = ws_connector('server_status', kind);
      ws.onmessage = function (msg) {
        if (msg.data === 'finish_ws') {
          ws.close();
          return;
        }
        callback(msg.data);
      };
    };
  };


  // View Model factory
  var new_toggle_button = function (model) {
    return new Vue({
      template: TEMPLATE_ID,
      methods: {
        // confirm and start server.
        start: function () {
          var self = this;
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_start).done(function () {
            model.start();
            self.status(true);
          });
        },
        // confirm and stop server.
        stop: function () {
          var self = this;
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_stop).done(function () {
            model.stop();
            self.status(true);
          });
        },
        // Update ViewModel state, and watch sate change.
        status: function (background) {
          var self = this;
          model.status(background).done(function (state) {
            self.state = state;
            if (background || self.is_inprogress) {
              model.watch(function (state) {
                self.state = state;
              });
            }
          });
        },
        // toggle server state.
        toggle: function () {
          this.$event.preventDefault();
          if (this.running) {
            this.stop();
          } else if (this.stopped) {
            this.start();
          }
        },
      },
      computed: {
        running: function () {
          return this.state === 'running';
        },
        stopped: function () {
          return this.state === 'stopped';
        },
        is_inprogress: function () {
          return model.is_inprogress(this.state);
        },
        status_text: function () {
          var res = _.capitalize(model.kind) + ' Server ';
          if (this.running) {
            res += 'is ' + this.state + '.';
          } else if (this.stopped) {
            res += 'was ' + this.state + '.';
          } else if (this.is_inprogress) {
            res += this.state + '...';
          }
          return res;
        },
        btn_class: function () {
          if (this.running) {
            return 'btn-success';
          } else if (this.stopped) {
            return 'btn-default';
          } else if (this.is_inprogress) {
            return 'btn-warning';
          }
        },
        tooltip: function () {
          if (this.is_inprogress) {
            return;
          }
          return model.msgs().tooltip;
        },
      },
      created: function () {
        this.$set('state', null);
        this.status();
      },
    });
  };

  var build = function (kind) {
    var vm = new_toggle_button(new ServerStatus(kind));
    var fragment = document.createDocumentFragment();
    vm.$mount(fragment);
    vm.$after(TEMPLATE_ID);
  };


  build('zabbix');
  build('chef');
})();
