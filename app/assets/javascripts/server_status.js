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
    // not logined
    return;
  }

  // Model
  var ServerStatus = function (kind) {
    var ajax = new AjaxSet.Resources('server_status');
    ajax.add_member('start',  'POST', 'kind');
    ajax.add_member('stop',   'POST', 'kind');
    ajax.add_member('status', 'POST', 'kind');

    this.kind = kind;
    this.msgs = function () {
      return t('js.server_status.' + kind);
    };

    var params = {kind: kind};

    this.start = function () {
      ajax.start(params);
    };

    this.stop = function () {
      ajax.stop(params);
    };

    this.status = function (background) {
      var p = _.clone(params);
      if (background) {
        p.background = true;
      }
      return ajax.status(p);
    };

    this.is_inprogress = function (state) {
      return !(state === 'running' || state === 'stopped');
    };

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


  // View Model
  var new_toggle_button = function (model) {
    return new Vue({
      template: TEMPLATE_ID,
      methods: {
        start: function () {
          var self = this;
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_start).done(function () {
            model.start();
            self.status(true);
          });
        },
        stop: function () {
          var self = this;
          bootstrap_confirm(model.msgs().title, model.msgs().confirm_stop).done(function () {
            model.stop();
            self.status(true);
          });
        },
        is_inprogress: function () {
          return model.is_inprogress(this.state);
        },
        status: function (background) {
          var self = this;
          model.status(background).done(function (state) {
            self.state = state;
            if (background || self.is_inprogress()) {
              model.watch(function (state) {
                self.state = state;
              });
            }
          });
        },
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
        status_text: function () {
          var res = _.capitalize(model.kind) + ' Server ';
          if (this.running) {
            res += 'is ' + this.state + '.';
          } else if (this.stopped) {
            res += 'was ' + this.state + '.';
          } else if (this.is_inprogress()) {
            res += this.state + '...';
          }
          return res;
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
