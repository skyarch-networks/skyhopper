//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../declares.d.ts" />
var ModelBase = (function () {
    function ModelBase() {
    }
    ModelBase.prototype.WrapAndResolveReject = function (fn) {
        var dfd = $.Deferred();
        var d = fn(dfd);
        d.done(this.resolveF(dfd));
        d.fail(this.rejectF(dfd));
        return dfd.promise();
    };
    ModelBase.prototype.Wrap = function (fn) {
        var dfd = $.Deferred();
        fn(dfd);
        return dfd.promise();
    };
    ModelBase.prototype.resolveF = function (dfd) {
        return function (data) { return dfd.resolve(data); };
    };
    ModelBase.prototype.rejectF = function (dfd) {
        return function (xhr) { return dfd.reject(xhr.responseText); };
    };
    return ModelBase;
}());
exports.default = ModelBase;
