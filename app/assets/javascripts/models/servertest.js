"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Servertest = (function (_super) {
    __extends(Servertest, _super);
    function Servertest(infra_id) {
        _super.call(this);
        this.infra_id = infra_id;
    }
    Servertest.prototype.create = function (fname, value, category) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Servertest.ajax.create({
                servertest: {
                    name: fname,
                    value: value,
                    infrastructure_id: _this.infra_id,
                    category: category,
                }
            });
        });
    };
    Servertest.prototype.generate_awspec = function () {
        var dfd = $.Deferred();
        Servertest.ajax.generate_awspec({ infrastructure_id: this.infra_id })
            .done(this.wait_change_status(this.infra_id, dfd, 'awspec-generate'))
            .fail(this.rejectF(dfd));
        return dfd.promise();
    };
    Servertest.ajax = new AjaxSet.Resources('servertests');
    return Servertest;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Servertest;
Servertest.ajax.add_collection('generate_awspec', 'GET');
