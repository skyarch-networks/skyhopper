"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var modal_1 = require('./modal');
var Server = (function () {
    function Server(kind) {
        this.kind = kind;
        this.params = { kind: kind };
    }
    Server.is_inprogress = function (state) {
        return !(state === 'running' || state === 'stopped');
    };
    Server.prototype.msgs = function () { return t('js.server_status.' + this.kind); };
    Server.prototype.start = function () { Server.ajax.start(this.params); };
    Server.prototype.stop = function () { Server.ajax.stop(this.params); };
    Server.prototype.status = function (background) {
        var p = _.merge({ background: background }, this.params);
        return Server.ajax.status(p);
    };
    Server.prototype.watch = function (callback) {
        var ws = ws_connector('server_status', this.kind);
        ws.onmessage = function (msg) {
            callback(msg.data);
        };
    };
    ;
    Server.ajax = new AjaxSet.Resources('server_status');
    return Server;
}());
Server.ajax.add_member('start', 'POST', 'kind');
Server.ajax.add_member('stop', 'POST', 'kind');
Server.ajax.add_member('status', 'POST', 'kind');
var App = (function (_super) {
    __extends(App, _super);
    function App(model, el) {
        _super.call(this);
        this.model = model;
        this._init({
            el: el,
            data: { state: this.state },
            template: App.TEMPLATE_ID,
            methods: {
                start: this.start,
                stop: this.stop,
                status: this.status,
                toggle: this.toggle,
            },
            computed: {
                running: this.running,
                stopped: this.stopped,
                is_inprogress: this.is_inprogress,
                status_text: this.status_text,
                btn_class: this.btn_class,
                tooltip: this.tooltip,
            },
            created: this._created,
        });
    }
    App.prototype.start = function () {
        var _this = this;
        modal_1.Confirm(this.model.msgs().title, this.model.msgs().confirm_start).done(function () {
            _this.model.start();
        });
    };
    App.prototype.stop = function () {
        var _this = this;
        modal_1.Confirm(this.model.msgs().title, this.model.msgs().confirm_stop).done(function () {
            _this.model.stop();
        });
    };
    App.prototype.status = function (background) {
        var _this = this;
        this.model.status(background).done(function (state) {
            _this.state = state;
            if (background || _this.is_inprogress) {
                _this.model.watch(function (w_state) {
                    _this.state = w_state;
                });
            }
        });
    };
    App.prototype.toggle = function () {
        if (this.running) {
            this.stop();
        }
        else if (this.stopped) {
            this.start();
        }
    };
    App.prototype.running = function () { return this.state === 'running'; };
    App.prototype.stopped = function () { return this.state === 'stopped'; };
    App.prototype.is_inprogress = function () { return Server.is_inprogress(this.state); };
    App.prototype.status_text = function () {
        var res = _.capitalize(this.model.kind) + ' Server ';
        if (this.running) {
            res += 'is ' + this.state + '.';
        }
        else if (this.stopped) {
            res += 'was ' + this.state + '.';
        }
        else if (this.is_inprogress) {
            res += this.state + '...';
        }
        return res;
    };
    App.prototype.btn_class = function () {
        if (this.running) {
            return 'btn-success';
        }
        else if (this.stopped) {
            return 'btn-default';
        }
        else if (this.is_inprogress) {
            return 'btn-warning';
        }
    };
    App.prototype.tooltip = function () {
        if (this.is_inprogress) {
            return "";
        }
        return this.model.msgs().tooltip;
    };
    App.prototype._created = function () {
        console.log(this);
        this.status(true);
    };
    App.TEMPLATE_ID = '#toggle-button-template';
    return App;
}(Vue));
function Build(kind) {
    var el = document.createElement('div');
    var parent = document.querySelector(App.TEMPLATE_ID).parentElement;
    parent.appendChild(el);
    var vm = new App(new Server(kind), el);
}
;
function Available() {
    return !!document.querySelector(App.TEMPLATE_ID);
}
;
function Do() {
    if (!Available()) {
        return;
    }
    Build('zabbix');
    Build('chef');
}
exports.Do = Do;
