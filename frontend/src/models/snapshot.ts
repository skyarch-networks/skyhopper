//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />

class Snapshot extends ModelBase {
  constructor(private infra_id: string) {super(); }

  static ajax = new AjaxSet.Resources('snapshots');

  index(volume_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Snapshot.ajax.index({
        infra_id:  this.infra_id,
        volume_id: volume_id
      })
    );
  }

  private watch_snapshot_progress(dfd: JQueryDeferred<any>): (d: any) => void {
    return (data: any) => {
      const ws = ws_connector('snapshot_status', data.snapshot_id);
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
  }

  create(volume_id: string, physical_id: string): JQueryPromise<any> {
    const dfd = $.Deferred();

    Snapshot.ajax.create({
      infra_id: this.infra_id,
      volume_id: volume_id,
      physical_id: physical_id
    }).done((data: any) => {
      dfd.notify(data);
      this.watch_snapshot_progress(dfd)(data);
    }).fail(this.rejectF(dfd));

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

Snapshot.ajax.add_collection('schedule', 'POST');
