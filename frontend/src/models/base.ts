//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

export default class ModelBase {
  protected WrapAndResolveReject(
    fn: (_dfd: JQueryDeferred<any>) => JQueryPromise<any>
  ): JQueryPromise<any> {
    const dfd = $.Deferred();
    const d = fn(dfd);
    d.done(this.resolveF(dfd));
    d.fail(this.rejectF(dfd));
    return dfd.promise();
  }

  protected Wrap(
    fn: (_dfd: JQueryDeferred<any>) => void
  ): JQueryPromise<any> {
    const dfd = $.Deferred();
    fn(dfd);
    return dfd.promise();
  }

  protected resolveF(dfd: JQueryDeferred<any>) {
    return (data: any) => dfd.resolve(data);
  }

  protected rejectF(dfd: JQueryDeferred<any>) {
    return (xhr: XMLHttpRequest) => dfd.reject(xhr.responseText);
  }

  // ec2 のステータス変更をWebSocketで待ち受けて、dfdをrejectかresolveする function を返す
  protected wait_change_status(id: any, dfd: JQueryDeferred<any>, scope: string): () => void {
    return () => {
      const ws = ws_connector(scope, id);
      ws.onmessage = function (msg) {
        const d = JSON.parse(msg.data);
        if (!d.status) {
          dfd.reject(d.message);
        } else {
          dfd.resolve(d);
        }
        ws.close();
      };
    };
  }
}
