"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Infrastructure = (function (_super) {
    __extends(Infrastructure, _super);
    function Infrastructure(id) {
        _super.call(this);
        this.id = id;
    }
    Infrastructure.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.show({ id: _this.id });
        });
    };
    Infrastructure.prototype.detach = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.destroy({ id: _this.id, });
        });
    };
    Infrastructure.prototype.delete_stack = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.delete_stack({ id: _this.id, });
        });
    };
    Infrastructure.prototype.stack_events = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.stack_events({ id: _this.id, });
        });
    };
    Infrastructure.prototype.logs = function (page, sort_key, order) {
        if (page === void 0) { page = 1; }
        var data = {
            infrastructure_id: this.id,
            page: page,
        };
        if (sort_key !== void 0) {
            data.sort_key = sort_key;
        }
        if (order !== void 0) {
            data.order = order;
        }
        return this.WrapAndResolveReject(function () {
            return $.ajax({
                url: '/infrastructure_logs',
                data: data,
            });
        });
    };
    Infrastructure.prototype.download_log = function (infrastructure_log_id) {
        var url = '/infrastructure_logs/' + infrastructure_log_id + '/download';
        window.open(url, '_blank');
    };
    Infrastructure.prototype.download_logs = function () {
        var url = '/infrastructure_logs/download_all?infrastructure_id=' + this.id;
        window.open(url, '_blank');
    };
    Infrastructure.prototype.get_schedule = function (physical_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.get_schedule({
                infra_id: _this.id,
                physical_id: physical_id,
            });
        });
    };
    Infrastructure.prototype.show_elb = function (physical_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.show_elb({
                id: _this.id,
                physical_id: physical_id,
            });
        });
    };
    Infrastructure.prototype.save_schedule = function (physical_id, sel_instance) {
        if (sel_instance === void 0) { sel_instance = []; }
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.save_schedule({
                physical_id: physical_id,
                selected_instance: sel_instance,
            });
        });
    };
    Infrastructure.ajax_infra = new AjaxSet.Resources('infrastructures');
    Infrastructure.ajax_resource = new AjaxSet.Resources('resources');
    return Infrastructure;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Infrastructure;
Infrastructure.ajax_infra.add_member('delete_stack', 'POST');
Infrastructure.ajax_infra.add_member('save_schedule', 'POST');
Infrastructure.ajax_infra.add_member('stack_events', 'GET');
Infrastructure.ajax_infra.add_member('get_schedule', 'GET');
Infrastructure.ajax_infra.add_member('show_elb', 'GET');
