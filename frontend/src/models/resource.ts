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

export default class Resource extends ModelBase {
  constructor(private infra: Infrastructure) {super(); }

  static ajax = new AjaxSet.Resources('resources');

  index(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Resource.ajax.index({infra_id: this.infra.id})
    );
  }

  create(physical_id: string, screen_name: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Resource.ajax.create({
        infra_id:    this.infra.id,
        physical_id: physical_id,
        screen_name: screen_name,
      })
    );
  }

}
