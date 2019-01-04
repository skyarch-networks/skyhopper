"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var EC2Instance = (function (_super) {
    __extends(EC2Instance, _super);
    function EC2Instance(infra, physical_id) {
        _super.call(this);
        this.infra = infra;
        this.physical_id = physical_id;
        this.params = { id: physical_id, infra_id: infra.id };
    }
    EC2Instance.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.show(_this.params);
        });
    };
    EC2Instance.prototype.update = function (runlist) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.update(_.merge(_this.params, { runlist: runlist }));
        });
    };
    EC2Instance.prototype.bootstrap = function () {
        var _this = this;
        var dfd = $.Deferred();
        EC2Instance.ajax_node.run_bootstrap(this.params)
            .done(function (data) {
            var ws = ws_connector('bootstrap', _this.physical_id);
            ws.onmessage = function (msg) {
                ws.close();
                var wsdata = JSON.parse(msg.data);
                if (wsdata.status) {
                    dfd.resolve(wsdata.message);
                }
                else {
                    dfd.reject(wsdata.message);
                }
            };
        })
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.watch_cook = function (dfd) {
        var ws = ws_connector('cooks', this.physical_id);
        ws.onmessage = function (msg) {
            var data = JSON.parse(msg.data).v;
            if (typeof (data) === 'boolean') {
                ws.close();
                dfd.resolve(data);
            }
            else {
                dfd.notify('update', data + "\n");
            }
        };
        return dfd;
    };
    EC2Instance.prototype._cook = function (method_name, params) {
        var _this = this;
        var dfd = $.Deferred();
        EC2Instance.ajax_node[method_name](params)
            .done(function (data) {
            dfd.notify('start', data);
            _this.watch_cook(dfd);
        })
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.cook = function (params) {
        return this._cook('cook', _.merge(this.params, params));
    };
    EC2Instance.prototype.yum_update = function (security, exec) {
        var extra_params = {
            security: security ? 'security' : 'all',
            exec: exec ? 'exec' : 'check',
        };
        var params = _.merge(this.params, extra_params);
        return this._cook('yum_update', params);
    };
    EC2Instance.prototype.apply_dish = function (dish_id) {
        var params = _.merge(this.params, dish_id ? { dish_id: dish_id } : {});
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.apply_dish(params);
        });
    };
    EC2Instance.prototype.submit_groups = function (group_ids) {
        var params = _.merge(this.params, group_ids ? { group_ids: group_ids } : {});
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.submit_groups(params);
        });
    };
    EC2Instance.prototype.create_group = function (group_params) {
        var params = _.merge(this.params, group_params ? { group_params: group_params } : {});
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.create_group(params);
        });
    };
    EC2Instance.prototype.get_rules = function (group_ids) {
        var params = _.merge(this.params, group_ids ? { group_ids: group_ids } : []);
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.get_rules(params);
        });
    };
    EC2Instance.prototype.get_security_groups = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.get_security_groups(_this.params);
        });
    };
    EC2Instance.prototype.edit = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.edit(_this.params);
        });
    };
    EC2Instance.prototype.edit_attributes = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_node.edit_attributes(this.params)
            .done(function (data) {
            _.forEach(data, function (val) {
                val.input_type = val.type === 'Boolean' ? 'checkbox' : 'text';
            });
            dfd.resolve(data);
        })
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.update_attributes = function (attributes) {
        var _this = this;
        var req = {};
        _.forEach(attributes, function (v, key) {
            req[key] = v.value;
        });
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.update_attributes(_.merge(_this.params, { attributes: JSON.stringify(req) }));
        });
    };
    EC2Instance.prototype.edit_ansible_playbook = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
          return EC2Instance.ajax_node.edit_ansible_playbook(_this.params);
        });
    };
    EC2Instance.prototype.update_ansible_playbook = function (playbook_roles) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
          return EC2Instance.ajax_node.update_ansible_playbook(_.merge(_this.params, { playbook_roles: playbook_roles }));
        });
    };
    EC2Instance.prototype.schedule_yum = function (schedule) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.schedule_yum(_.merge(_this.params, {
                physical_id: _this.physical_id,
                infra_id: _this.infra.id,
                schedule: schedule,
            }));
        });
    };
    EC2Instance.prototype.attachable_volumes = function (availability_zone) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.attachable_volumes(_.merge(_this.params, {
                availability_zone: availability_zone
            }));
        });
    };
    EC2Instance.prototype.attach_volume = function (volume_id, device_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.attach_volume(_.merge(_this.params, {
                volume_id: volume_id,
                device_name: device_name
            }));
        });
    };
    EC2Instance.prototype.detach_volume = function (volume_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.detach_volume(_.merge(_this.params, {
                volume_id: volume_id,
            }));
        });
    };
    EC2Instance.prototype.recipes = function (cookbook) {
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_node.recipes({ cookbook: cookbook });
        });
    };
    EC2Instance.prototype.select_serverspec = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_servertest.select({
            physical_id: this.physical_id,
            infra_id: this.infra.id,
        }).done(function (data) {
            _.forEach(data.globals, function (s) {
                s.checked = _.include(data.selected_ids, s.id);
            });
            _.forEach(data.individuals, function (s) {
                s.checked = false;
            });
            dfd.resolve(data);
        }).fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.results_servertest = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_servertest.results({
            physical_id: this.physical_id,
            infra_id: this.infra.id,
        }).done(function (data) {
            dfd.resolve(data);
        }).fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.run_serverspec = function (specs, auto) {
        var _this = this;
        var dfd = $.Deferred();
        var ids = _(specs).filter(function (v) {
            return v.checked;
        }).pluck('id').value();
        if (auto) {
            ids.push(-1);
        }
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_servertest.run_serverspec({
                physical_id: _this.physical_id,
                infra_id: _this.infra.id,
                servertest_ids: ids,
            });
        });
    };
    EC2Instance.prototype.schedule_serverspec = function (schedule) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_servertest.schedule({
                physical_id: _this.physical_id,
                infra_id: _this.infra.id,
                schedule: schedule,
            });
        });
    };
    EC2Instance.prototype.change_scale = function (type) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.change_scale(_.merge(_this.params, { instance_type: type }));
        });
    };
    EC2Instance.prototype.wait_change_status_ec2 = function (dfd) {
        var _this = this;
        return function () {
            var ws = ws_connector('ec2_status', _this.physical_id);
            ws.onmessage = function (msg) {
                var d = JSON.parse(msg.data);
                if (d.error) {
                    dfd.reject(d.error.message);
                }
                else {
                    dfd.resolve(d.msg);
                }
                ws.close();
            };
        };
    };
    EC2Instance.prototype.available_resources = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.available_resources({ infra_id: _this.params.infra_id });
        });
    };
    EC2Instance.prototype.start_ec2 = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_ec2.start(this.params)
            .done(this.wait_change_status_ec2(dfd))
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.stop_ec2 = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_ec2.stop(this.params)
            .done(this.wait_change_status_ec2(dfd))
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.detach_ec2 = function (zabbix, chef) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.detach(_.merge({ zabbix: zabbix, chef: chef }, _this.params));
        });
    };
    EC2Instance.prototype.terminate_ec2 = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.terminate(_this.params);
        });
    };
    EC2Instance.prototype.reboot_ec2 = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_ec2.reboot(this.params)
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.serverspec_status = function () {
        var dfd = $.Deferred();
        EC2Instance.ajax_ec2.serverspec_status(this.params)
            .done(function (data) {
            dfd.resolve(data.status);
        }).fail(this.rejectF(dfd));
        return dfd.promise();
    };
    EC2Instance.prototype.register = function (elb_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.register_to_elb(_.merge(_this.params, { elb_name: elb_name }));
        });
    };
    EC2Instance.prototype.deregister = function (elb_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.deregister_from_elb(_.merge(_this.params, { elb_name: elb_name }));
        });
    };
    EC2Instance.prototype.elb_submit_groups = function (group_ids, elb_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.elb_submit_groups(_.merge(_this.params, { group_ids: group_ids, elb_name: elb_name }));
        });
    };
    EC2Instance.prototype.create_listener = function (elb_name, protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_elb.create_listener(_.merge(_this.params, {
                elb_name: elb_name,
                elb_listener_protocol: protocol,
                elb_listener_load_balancer_port: load_balancer_port,
                elb_listener_instance_protocol: instance_protocol,
                elb_listener_instance_port: instance_port,
                elb_listener_ssl_certificate_id: ssl_certificate_id
            }));
        });
    };
    EC2Instance.prototype.delete_listener = function (elb_name, load_balancer_port) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_elb.delete_listener(_.merge(_this.params, { elb_name: elb_name, elb_listener_load_balancer_port: load_balancer_port }));
        });
    };
    EC2Instance.prototype.update_listener = function (elb_name, protocol, old_load_balancer_port, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_elb.update_listener(_.merge(_this.params, {
                elb_name: elb_name,
                elb_listener_protocol: protocol,
                elb_listener_old_load_balancer_port: old_load_balancer_port,
                elb_listener_load_balancer_port: load_balancer_port,
                elb_listener_instance_protocol: instance_protocol,
                elb_listener_instance_port: instance_port,
                elb_listener_ssl_certificate_id: ssl_certificate_id
            }));
        });
    };
    EC2Instance.prototype.upload_server_certificate = function (elb_name, server_certificate_name, certificate_body, private_key, certificate_chain) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_elb.upload_server_certificate(_.merge(_this.params, {
                elb_name: elb_name,
                ss_server_certificate_name: server_certificate_name,
                ss_certificate_body: certificate_body,
                ss_private_key: private_key,
                ss_certificate_chain: certificate_chain,
            }));
        });
    };
    EC2Instance.prototype.delete_server_certificate = function (elb_name, server_certificate_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_elb.delete_server_certificate(_.merge(_this.params, { elb_name: elb_name, ss_server_certificate_name: server_certificate_name }));
        });
    };
    EC2Instance.prototype.create_volume = function (options) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return EC2Instance.ajax_ec2.create_volume(_.merge(_this.params, options));
        });
    };
    EC2Instance.ajax_node = new AjaxSet.Resources('nodes');
    EC2Instance.ajax_ec2 = new AjaxSet.Resources('ec2_instances');
    EC2Instance.ajax_servertest = new AjaxSet.Resources('servertests');
    EC2Instance.ajax_elb = new AjaxSet.Resources('elb');
    return EC2Instance;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EC2Instance;
EC2Instance.ajax_node.add_member('cook', 'PUT');
EC2Instance.ajax_node.add_member('yum_update', 'PUT');
EC2Instance.ajax_node.add_member('run_bootstrap', 'GET');
EC2Instance.ajax_node.add_member('get_rules', 'GET');
EC2Instance.ajax_node.add_member('get_security_groups', 'GET');
EC2Instance.ajax_node.add_member('apply_dish', 'POST');
EC2Instance.ajax_node.add_member('submit_groups', 'POST');
EC2Instance.ajax_node.add_member('edit_attributes', 'GET');
EC2Instance.ajax_node.add_member('update_attributes', 'PUT');
EC2Instance.ajax_node.add_member('edit_ansible_playbook', 'GET');
EC2Instance.ajax_node.add_member('update_ansible_playbook', 'PUT');
EC2Instance.ajax_node.add_member('schedule_yum', 'POST');
EC2Instance.ajax_node.add_collection('recipes', 'GET');
EC2Instance.ajax_node.add_collection('create_group', 'POST');
EC2Instance.ajax_ec2.add_member('change_scale', 'POST');
EC2Instance.ajax_ec2.add_member("start", "POST");
EC2Instance.ajax_ec2.add_member("stop", "POST");
EC2Instance.ajax_ec2.add_member("reboot", "POST");
EC2Instance.ajax_ec2.add_member("detach", "POST");
EC2Instance.ajax_ec2.add_member("terminate", "POST");
EC2Instance.ajax_ec2.add_member('serverspec_status', 'GET');
EC2Instance.ajax_ec2.add_member('register_to_elb', 'POST');
EC2Instance.ajax_ec2.add_member('deregister_from_elb', 'POST');
EC2Instance.ajax_ec2.add_member('elb_submit_groups', 'POST');
EC2Instance.ajax_ec2.add_member('attachable_volumes', 'GET');
EC2Instance.ajax_ec2.add_member('attach_volume', 'POST');
EC2Instance.ajax_ec2.add_member('detach_volume', 'POST');
EC2Instance.ajax_ec2.add_member('available_resources', 'GET');
EC2Instance.ajax_ec2.add_collection('create_volume', 'POST');
EC2Instance.ajax_servertest.add_collection('select', 'GET');
EC2Instance.ajax_servertest.add_collection('results', 'GET');
EC2Instance.ajax_servertest.add_collection("run_serverspec", "POST");
EC2Instance.ajax_servertest.add_collection('schedule', 'POST');
EC2Instance.ajax_elb.add_collection('create_listener', 'POST');
EC2Instance.ajax_elb.add_collection('delete_listener', 'POST');
EC2Instance.ajax_elb.add_collection('update_listener', 'POST');
EC2Instance.ajax_elb.add_collection('upload_server_certificate', 'POST');
EC2Instance.ajax_elb.add_collection('delete_server_certificate', 'POST');
