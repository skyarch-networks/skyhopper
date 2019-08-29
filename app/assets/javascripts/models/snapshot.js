const ModelBase = require('./base').default;

const Snapshot = class Snapshot extends ModelBase {
  constructor(infraId) {
    super();
    this.infra_id = infraId;
    Snapshot.ajax = new AjaxSet.Resources('snapshots');
    Snapshot.ajax.add_collection('schedule', 'POST');
    Snapshot.ajax.add_collection('save_retention_policy', 'POST');
  }

  index(volumeId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => Snapshot.ajax.index({
        infra_id: self.infra_id,
        volume_id: volumeId,
      }),
    );
  }

  watch_snapshot_progress(dfd) {
    return (data) => {
      const ws = wsConnector('snapshot_status', data.snapshot_id);
      ws.onmessage = (msg) => {
        switch (msg.data) {
          case 'completed':
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
  }

  create(volumeId, physicalId) {
    const self = this;
    const dfd = $.Deferred();
    Snapshot.ajax.create({
      infra_id: this.infra_id,
      volume_id: volumeId,
      physical_id: physicalId,
    }).done((data) => {
      dfd.notify(data);
      self.watch_snapshot_progress(dfd)(data);
    }).fail(this.rejectF(dfd));
    return dfd.promise();
  }

  destroy(snapshotId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => Snapshot.ajax.destroy({
        infra_id: self.infra_id,
        id: snapshotId,
      }),
    );
  }

  schedule(volumeId, physicalId, schedule) {
    const self = this;
    return this.WrapAndResolveReject(
      () => Snapshot.ajax.schedule({
        infra_id: self.infra_id,
        volume_id: volumeId,
        physical_id: physicalId,
        schedule,
      }),
    );
  }

  save_retention_policy(volumeId, enabled, maxAmount) {
    const self = this;
    return this.WrapAndResolveReject(
      () => Snapshot.ajax.save_retention_policy({
        infra_id: self.infra_id,
        volume_id: volumeId,
        enabled,
        max_amount: maxAmount,
      }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Snapshot;
