"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Dish = (function (_super) {
    __extends(Dish, _super);
    function Dish(id) {
        _super.call(this);
        this.id = id;
    }
    Dish.prototype.runlist = function (id) {
        return this.WrapAndResolveReject(function () {
            return Dish.ajax.runlist({ id: id });
        });
    };
    Dish.ajax = new AjaxSet.Resources('dishes');
    return Dish;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dish;
Dish.ajax.add_member('runlist', 'GET');
