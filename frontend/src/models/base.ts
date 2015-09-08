//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

class ModelBase {
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
}
