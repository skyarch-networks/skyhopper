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
    resource_id: string,
    start_date: string,
    end_date: string,
    start_time: string,
    end_time: string,
    repeat_freq: string
}

export default class OperationDuration extends ModelBase {
  constructor(private infra_id: string, private physical_id: string) {super(); }

  static ajax = new AjaxSet.Resources('operation_durations');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>OperationDuration.ajax).show({
        physical_id: this.physical_id,
        id: this.infra_id
      })
    );
  }

  create(instance: instance[]): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>OperationDuration.ajax).create({
        instance: instance,
        id: this.infra_id
      })
    );
  }

  show_icalendar(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>OperationDuration.ajax).show_icalendar({
        resource_id: this.physical_id,
        id: this.infra_id
      })
    );
  }


}

OperationDuration.ajax.add_member("show_icalendar", "GET");
OperationDuration.ajax.add_member("upload_icalendar", "POST");
