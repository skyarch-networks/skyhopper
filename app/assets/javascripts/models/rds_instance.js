"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var RDSInstance = (function (_super) {
    __extends(RDSInstance, _super);
    function RDSInstance(infra, physical_id) {
        _super.call(this);
        this.infra = infra;
        this.physical_id = physical_id;
        this.params = {
            physical_id: physical_id,
            id: infra.id,
        };
    }
    RDSInstance.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.show_rds(_this.params);
        });
    };
    RDSInstance.prototype.change_scale = function (type) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.change_rds_scale(_.merge(_this.params, { instance_type: type }));
        });
    };
    RDSInstance.prototype.gen_serverspec = function (parameter) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_serverspec.create_for_rds(_.merge({ physical_id: _this.physical_id, infra_id: _this.infra.id }, parameter));
        });
    };
    RDSInstance.prototype.rds_submit_groups = function (group_ids) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.rds_submit_groups(_.merge(_this.params, { group_ids: group_ids }));
        });
    };
    RDSInstance.prototype.start_rds = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.start_rds(_this.params);
        });
    };
    RDSInstance.prototype.stop_rds = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.stop_rds(_this.params);
        });
    };
    RDSInstance.prototype.reboot_rds = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return RDSInstance.ajax_infra.reboot_rds(_this.params);
        });
    };
    RDSInstance.ajax_infra = new AjaxSet.Resources('infrastructures');
    RDSInstance.ajax_serverspec = new AjaxSet.Resources('serverspecs');
    return RDSInstance;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RDSInstance;
RDSInstance.ajax_infra.add_member('show_rds', 'GET');
RDSInstance.ajax_infra.add_member('change_rds_scale', 'POST');
RDSInstance.ajax_infra.add_member('rds_submit_groups', 'POST');
RDSInstance.ajax_infra.add_member('start_rds', 'POST');
RDSInstance.ajax_infra.add_member('stop_rds', 'POST');
RDSInstance.ajax_infra.add_member('reboot_rds', 'POST');
RDSInstance.ajax_serverspec.add_collection('create_for_rds', 'PUT');
