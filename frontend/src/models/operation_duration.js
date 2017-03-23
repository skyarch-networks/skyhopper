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
var OperationDuration = (function (_super) {
    __extends(OperationDuration, _super);
    function OperationDuration(infra, physical_id) {
        var _this = _super.call(this) || this;
        _this.infra = infra;
        _this.physical_id = physical_id;
        return _this;
    }
    OperationDuration.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return OperationDuration.ajax.show({
                physical_id: _this.physical_id,
                infra_id: _this.infra.id
            });
        });
    };
    OperationDuration.prototype.create_host = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Monitoring.ajax.create_host({
                templates: templates,
                id: _this.infra.id
            });
        });
    };
    return OperationDuration;
}(base_1.default));
OperationDuration.ajax = new AjaxSet.Resources('operation_durations');
exports.default = OperationDuration;
OperationDuration.ajax.add_member("show", "GET");
