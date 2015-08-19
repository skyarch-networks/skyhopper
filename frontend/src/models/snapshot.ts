/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />

class Snapshot extends ModelBase {
  constructor(private infra_id: string) {super(); }

  static ajax = new AjaxSet.Resources('snapshot')

  index(volume_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Snapshot.ajax.index({
        infra_id:  this.infra_id,
        volume_id: volume_id
      })
    );
  }

  watch_snapshot_progress(dfd: JQueryDeferred<any>): any {
    return (data: any) => {
      const ws = ws_connector('snapshot_status', data.snapshot_id);
      ws.onmessage = function (msg) {
        if (msg.data === 'completed') {
          dfd.resolve(data);
          ws.close();
        };
      };
    }
  }

  create(volume_id: string, physical_id: string): JQueryPromise<any> {
    const dfd = $.Deferred();

    Snapshot.ajax.create({volume_id: volume_id, physical_id: physical_id})
      .done((data: any) => {
        this.watch_snapshot_progress(dfd)(data);
      })
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  destroy(snapshot_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Snapshot.ajax.destroy({
        infra_id: this.infra_id,
        id:       snapshot_id
      })
    );
  }

  schedule(volume_id: string, physical_id: string, schedule: any): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Snapshot.ajax).schedule({
        infra_id:    this.infra_id,
        volume_id:   volume_id,
        physical_id: physical_id,
        schedule:    schedule
      })
    );
  }
}

Snapshot.ajax.add_member('schedule', 'POST');
