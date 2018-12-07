"use strict";
var ModelBase = (function () {
    function ModelBase() {
    }
    ModelBase.prototype.WrapAndResolveReject = function (fn) {
        var dfd = $.Deferred();
        var d = fn(dfd);
        d.done(this.resolveF(dfd));
        d.fail(this.rejectF(dfd));
        return dfd.promise();
    };
    ModelBase.prototype.Wrap = function (fn) {
        var dfd = $.Deferred();
        fn(dfd);
        return dfd.promise();
    };
    ModelBase.prototype.resolveF = function (dfd) {
        return function (data) { return dfd.resolve(data); };
    };
    ModelBase.prototype.rejectF = function (dfd) {
        return function (xhr) { return dfd.reject(xhr.responseText); };
    };
    ModelBase.prototype.wait_change_status = function (id, dfd, scope) {
        return function () {
            var ws = ws_connector(scope, id);
            ws.onmessage = function (msg) {
                var d = JSON.parse(msg.data);
                if (!d.status) {
                    dfd.reject(d.message);
                }
                else {
                    dfd.resolve(d);
                }
                ws.close();
            };
        };
    };
    return ModelBase;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelBase;
