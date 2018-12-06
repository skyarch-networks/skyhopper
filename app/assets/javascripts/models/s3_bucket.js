"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var S3Bucket = (function (_super) {
    __extends(S3Bucket, _super);
    function S3Bucket(infra, physical_id) {
        _super.call(this);
        this.infra = infra;
        this.physical_id = physical_id;
    }
    S3Bucket.prototype.show = function () {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return S3Bucket.ajax.show_s3({
                bucket_name: _this.physical_id,
                id: _this.infra.id,
            });
        });
    };
    S3Bucket.ajax = new AjaxSet.Resources('infrastructures');
    return S3Bucket;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = S3Bucket;
S3Bucket.ajax.add_member("show_s3", "GET");
