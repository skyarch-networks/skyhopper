//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase      from './base';
import Infrastructure from './infrastructure';

export default class S3Bucket extends ModelBase {
  constructor(private infra: Infrastructure, private physical_id: string) {super(); }

  static ajax = new AjaxSet.Resources('infrastructures');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>S3Bucket.ajax).show_s3({
        bucket_name: this.physical_id,
        id: this.infra.id,
      })
    );
  }
}

S3Bucket.ajax.add_member("show_s3", "GET");
