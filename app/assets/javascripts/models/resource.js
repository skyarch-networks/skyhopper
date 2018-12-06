"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Resource = (function (_super) {
    __extends(Resource, _super);
    function Resource(infra) {
        _super.call(this);
        this.infra = infra;
    }
    Resource.prototype.index = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Resource.ajax.index({ infra_id: _this.infra.id });
        });
    };
    Resource.prototype.create = function (physical_id, screen_name) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Resource.ajax.create({
                infra_id: _this.infra.id,
                physical_id: physical_id,
                screen_name: screen_name,
            });
        });
    };
    Resource.ajax = new AjaxSet.Resources('resources');
    return Resource;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resource;
