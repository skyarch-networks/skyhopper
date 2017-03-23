//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../declares.d.ts" />
var base_1 = require("./base");
var Infrastructure = (function (_super) {
    __extends(Infrastructure, _super);
    function Infrastructure(id) {
        var _this = _super.call(this) || this;
        _this.id = id;
        return _this;
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
    Infrastructure.prototype.logs = function (page) {
        var _this = this;
        if (page === void 0) { page = 1; }
        return this.WrapAndResolveReject(function () {
            return $.ajax({
                url: '/infrastructure_logs',
                data: {
                    infrastructure_id: _this.id,
                    page: page,
                },
            });
        });
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
    Infrastructure.prototype.icalendar = function (resource_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.icalendar({
                id: _this.id,
                resource_id: resource_id
            });
        });
    };
    Infrastructure.prototype.upload_calendar = function (instance, value) {
        if (instance === void 0) { instance = []; }
        return this.WrapAndResolveReject(function () {
            return Infrastructure.ajax_infra.upload_calendar({
                instance: instance,
                value: value
            });
        });
    };
    return Infrastructure;
}(base_1.default));
Infrastructure.ajax_infra = new AjaxSet.Resources('infrastructures');
Infrastructure.ajax_resource = new AjaxSet.Resources('resources');
exports.default = Infrastructure;
Infrastructure.ajax_infra.add_member('delete_stack', 'POST');
Infrastructure.ajax_infra.add_member('save_schedule', 'POST');
Infrastructure.ajax_infra.add_member('upload_calendar', 'POST');
Infrastructure.ajax_infra.add_member('stack_events', 'GET');
Infrastructure.ajax_infra.add_member('get_schedule', 'GET');
Infrastructure.ajax_infra.add_member('show_elb', 'GET');
Infrastructure.ajax_infra.add_member('icalendar', 'GET');
