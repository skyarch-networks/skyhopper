"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Monitoring = (function (_super) {
    __extends(Monitoring, _super);
    function Monitoring(infra) {
        _super.call(this);
        this.infra = infra;
    }
    Monitoring.type = function (master) {
        if (master.name === 'URL') {
            return 'url';
        }
        else if (master.name === 'MySQL') {
            return 'mysql';
        }
        else if (master.name === 'PostgreSQL') {
            return 'postgresql';
        }
        else if (master.name === "HTTP" || master.name === "SMTP" || master.name === "BASICS") {
            return 'no_trigger';
        }
        return 'trigger';
    };
    Monitoring.prototype.create_host = function (templates) {
        var _this = this;
        if (templates === void 0) { templates = []; }
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.create_host({
                templates: templates,
                id: _this.infra.id
            });
        });
    };
    Monitoring.prototype.update_templates = function (physical_id, templates) {
        var _this = this;
        if (templates === void 0) { templates = []; }
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.update_templates({
                templates: templates,
                physical_id: physical_id,
                id: _this.infra.id
            });
        });
    };
    Monitoring.prototype.change_zabbix_server = function (zabbix_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.change_zabbix_server({
                zabbix_id: zabbix_id,
                id: _this.infra.id
            });
        });
    };
    Monitoring.prototype.edit = function () {
        var dfd = $.Deferred();
        Monitoring.ajax.edit({ id: this.infra.id }).done(function (data) {
            _.forEach(data.master_monitorings, function (m) {
                var selected = !!_.find(data.selected_monitoring_ids, function (id) { return id === m.id; });
                m.checked = selected;
                if (Monitoring.type(m) === 'trigger') {
                    var expr = data.trigger_expressions[m.item];
                    var v = parseInt(expr.replace(m.trigger_expression, '').replace(/[A-Z]/, ''));
                    m.value = v;
                }
                else if (Monitoring.type(m) === 'mysql') {
                    var re_1 = /^mysql.login\[(.+)\]/;
                    var key = _.findKey(data.trigger_expressions, function (_, key) { return re_1.test(key); });
                    if (key) {
                        m.value = key.match(re_1)[1];
                    }
                    else {
                        m.value = '';
                    }
                }
            });
            if (!data.web_scenarios) {
                data.web_scenarios = [];
            }
            dfd.resolve(data);
        }).fail(dfd.reject);
        return dfd.promise();
    };
    Monitoring.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.show({ id: _this.infra.id });
        });
    };
    Monitoring.prototype.update = function (master_monitorings, web_scenario) {
        var _this = this;
        if (web_scenario === void 0) { web_scenario = []; }
        var selected_monitorings = _.filter(master_monitorings, function (m) { return m.checked; });
        var exprs = [];
        var host_mysql = {};
        var host_postgresql = {};
        _.forEach(selected_monitorings, function (m) {
            if (Monitoring.type(m) === 'trigger') {
                exprs.push([m.id, m.value]);
            }
            else if (Monitoring.type(m) === 'mysql') {
                host_mysql.id = m.id;
                host_mysql.host = m.value || null;
            }
            else if (Monitoring.type(m) === 'postgresql') {
                host_postgresql.id = m.id;
                host_postgresql.host = m.value || null;
            }
        });
        var ids = _.pluck(selected_monitorings, 'id');
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.update({
                id: _this.infra.id,
                web_scenario: JSON.stringify(web_scenario),
                monitoring_ids: ids,
                expressions: JSON.stringify(exprs),
                host_mysql: JSON.stringify(host_mysql),
                host_postgresql: JSON.stringify(host_postgresql),
            });
        });
    };
    Monitoring.prototype.show_problems = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.show_problems({ id: _this.infra.id });
        });
    };
    Monitoring.prototype.show_url = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.show_url_status({ id: _this.infra.id });
        });
    };
    Monitoring.prototype.show_zabbix_graph = function (physical_id, item_key, date_range) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.show_zabbix_graph({
                id: _this.infra.id,
                physical_id: physical_id,
                item_key: item_key,
                date_range: date_range,
            });
        });
    };
    Monitoring.prototype.show_cloudwatch_graph = function (physical_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.show_cloudwatch_graph({
                id: _this.infra.id,
                physical_id: physical_id,
            });
        });
    };
    Monitoring.ajax = new AjaxSet.Resources('monitorings');
    return Monitoring;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Monitoring;
Monitoring.ajax.add_member('create_host', 'POST');
Monitoring.ajax.add_member('update_templates', 'POST');
Monitoring.ajax.add_member('change_zabbix_server', 'POST');
Monitoring.ajax.add_member("show_cloudwatch_graph", "GET");
Monitoring.ajax.add_member("show_problems", "GET");
Monitoring.ajax.add_member("show_url_status", "GET");
Monitoring.ajax.add_collection("show_zabbix_graph", "GET");
