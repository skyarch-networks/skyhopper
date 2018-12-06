"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var Snapshot = (function (_super) {
    __extends(Snapshot, _super);
    function Snapshot(infra_id) {
        _super.call(this);
        this.infra_id = infra_id;
    }
    Snapshot.prototype.index = function (volume_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Snapshot.ajax.index({
                infra_id: _this.infra_id,
                volume_id: volume_id
            });
        });
    };
    Snapshot.prototype.watch_snapshot_progress = function (dfd) {
        return function (data) {
            var ws = ws_connector('snapshot_status', data.snapshot_id);
            ws.onmessage = function (msg) {
                switch (msg.data) {
                    case "completed":
                        dfd.resolve(data);
                        ws.close();
                        break;
                    default:
                        dfd.reject(msg.data);
                        ws.close();
                        break;
                }
            };
        };
    };
    Snapshot.prototype.create = function (volume_id, physical_id) {
        var _this = this;
        var dfd = $.Deferred();
        Snapshot.ajax.create({
            infra_id: this.infra_id,
            volume_id: volume_id,
            physical_id: physical_id
        }).done(function (data) {
            dfd.notify(data);
            _this.watch_snapshot_progress(dfd)(data);
        }).fail(this.rejectF(dfd));
        return dfd.promise();
    };
    Snapshot.prototype.destroy = function (snapshot_id) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Snapshot.ajax.destroy({
                infra_id: _this.infra_id,
                id: snapshot_id
            });
        });
    };
    Snapshot.prototype.schedule = function (volume_id, physical_id, schedule) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Snapshot.ajax.schedule({
                infra_id: _this.infra_id,
                volume_id: volume_id,
                physical_id: physical_id,
                schedule: schedule
            });
        });
    };
    Snapshot.prototype.save_retention_policy = function (volume_id, enabled, max_amount) {
        var _this = this;
        return this.WrapAndResolveReject(function () {
            return Snapshot.ajax.save_retention_policy({
                infra_id: _this.infra_id,
                volume_id: volume_id,
                enabled: enabled,
                max_amount: max_amount
            });
        });
    };
    Snapshot.ajax = new AjaxSet.Resources('snapshots');
    return Snapshot;
}(base_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Snapshot;
Snapshot.ajax.add_collection('schedule', 'POST');
Snapshot.ajax.add_collection('save_retention_policy', 'POST');
