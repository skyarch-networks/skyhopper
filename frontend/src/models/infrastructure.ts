//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase from './base';

export default class Infrastructure extends ModelBase {
  constructor(public id: string) {super(); }

  static ajax_infra    = new AjaxSet.Resources('infrastructures');
  static ajax_resource = new AjaxSet.Resources('resources');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Infrastructure.ajax_infra.show({id: this.id})
    );
  }

  detach(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Infrastructure.ajax_infra.destroy({ id: this.id, })
    );
  }

  delete_stack(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Infrastructure.ajax_infra).delete_stack({ id: this.id, })
    );
  }

  stack_events(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Infrastructure.ajax_infra).stack_events({ id: this.id, })
    );
  }

  logs(page = 1, sort_key: string, order: number): JQueryPromise<any> {
    const data:any = {
      infrastructure_id: this.id,
      page: page,
    };
    if (sort_key !== void 0) {
      data.sort_key = sort_key;
    }
    if (order !== void 0) {
      data.order = order;
    }
    return this.WrapAndResolveReject(() =>
      $.ajax({
        url: '/infrastructure_logs',
        data: data,
      })
    );
  }

  download_log(infrastructure_log_id: number): void {
    const url = '/infrastructure_logs/' + infrastructure_log_id + '/download';
    window.open(url, '_blank');
  }

  download_logs(): void {
    const url = '/infrastructure_logs/download_all?infrastructure_id=' + this.id;
    window.open(url, '_blank');
  }

  get_schedule(physical_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
        (<any>Infrastructure.ajax_infra).get_schedule({
          infra_id: this.id,
          physical_id: physical_id,
        })
    );
  }

  show_elb(physical_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Infrastructure.ajax_infra).show_elb({
        id:          this.id,
        physical_id: physical_id,
      })
    );
  }

  save_schedule(physical_id: string, sel_instance: any[] = []): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
        (<any>Infrastructure.ajax_infra).save_schedule({
          physical_id: physical_id,
          selected_instance: sel_instance,
        })
    );
  }
}

Infrastructure.ajax_infra.add_member('delete_stack', 'POST');
Infrastructure.ajax_infra.add_member('save_schedule', 'POST');
Infrastructure.ajax_infra.add_member('stack_events', 'GET');
Infrastructure.ajax_infra.add_member('get_schedule', 'GET');
Infrastructure.ajax_infra.add_member('show_elb', 'GET');
