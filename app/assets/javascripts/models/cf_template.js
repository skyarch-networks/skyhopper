"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var CFTemplate = (function (_super) {
    __extends(CFTemplate, _super);
    function CFTemplate(infra) {
        _super.call(this);
        this.infra = infra;
    }
    CFTemplate.prototype.new = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return CFTemplate.ajax.new_for_creating_stack({
                infrastructure_id: _this.infra.id,
            });
        });
    };
    CFTemplate.prototype.show = function (id) {
        return this.WrapAndResolveReject(function () {
            return $.ajax({
                url: '/cf_templates/' + id,
                dataType: 'json',
            });
        });
    };
    CFTemplate.prototype.insert_cf_params = function (data) {
        var _this = this;
        return this.WrapAndResolveReject(function (dfd) {
            if (data.name === "") {
                dfd.reject(t('infrastructures.msg.empty_subject'));
            }
            var req = { cf_template: {
                    name: data.name,
                    detail: data.detail,
                    value: data.value,
                    format: data.format,
                    params: data.params,
                    infrastructure_id: _this.infra.id,
                } };
            return CFTemplate.ajax.insert_cf_params(req);
        });
    };
    CFTemplate.prototype.create_and_send = function (cft, params) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            var req = { cf_template: {
                    infrastructure_id: _this.infra.id,
                    name: cft.name,
                    detail: cft.detail,
                    value: cft.value,
                    format: cft.format,
                    cfparams: params,
                } };
            return CFTemplate.ajax.create_and_send(req);
        });
    };
    CFTemplate.prototype.history = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return CFTemplate.ajax.history({ infrastructure_id: _this.infra.id });
        });
    };
    CFTemplate.ajax = new AjaxSet.Resources('cf_templates');
    return CFTemplate;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CFTemplate;
CFTemplate.ajax.add_collection('insert_cf_params', 'POST');
CFTemplate.ajax.add_collection('history', 'GET');
CFTemplate.ajax.add_collection('new_for_creating_stack', 'GET');
CFTemplate.ajax.add_collection('create_and_send', 'POST');
