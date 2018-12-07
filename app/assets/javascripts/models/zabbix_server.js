"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var ZabbixServer = (function (_super) {
    __extends(ZabbixServer, _super);
    function ZabbixServer(session_id) {
        _super.call(this);
        this.session_id = session_id;
    }
    ZabbixServer.prototype.create = function (zabbix_server) {
        var dfd = $.Deferred();
        ZabbixServer.ajax.create({
            zabbix_server: zabbix_server,
            lang: zabbix_server.lang,
            commit: "Create Zabbix Server",
        })
            .done(this.wait_change_status(this.session_id, dfd, 'notifications'))
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    ZabbixServer.prototype.update = function (zabbix_server) {
        return this.WrapAndResolveReject(function () {
            return ZabbixServer.ajax.update({ zabbix_server: zabbix_server, id: zabbix_server.id });
        });
    };
    ZabbixServer.ajax = new AjaxSet.Resources('zabbix_servers');
    return ZabbixServer;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ZabbixServer;
