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

type instance = {
    start_date: string,
    end_date: string,
    start_time: string,
    end_time: string,
    repeat_freq: number
}

export default class OperationDuration extends ModelBase {
  constructor(private infra: Infrastructure, private physical_id: string) {super(); }

  static ajax = new AjaxSet.Resources('operation_durations');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>OperationDuration.ajax).show({
        physical_id: this.physical_id,
        infra_id: this.infra.id
      })
    );
  }

  create_host(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).create_host({
        templates: templates,
        id: this.infra.id
      })
    );
  }


}

OperationDuration.ajax.add_member("show", "GET");
