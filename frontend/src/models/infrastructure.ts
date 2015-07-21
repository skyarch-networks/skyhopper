/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />

class Infrastructure extends ModelBase {
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

  logs(page = 1): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      $.ajax({
        url: '/infrastructure_logs',
        data: {
          infrastructure_id: this.id,
          page: page,
        },
      })
    );
  }

  show_elb(physical_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Infrastructure.ajax_infra).show_elb({
        id:          this.id,
        pyhsical_id: physical_id,
      })
    );
  }
}

Infrastructure.ajax_infra.add_member('delete_stack', 'POST');
Infrastructure.ajax_infra.add_member('stack_events', 'GET');
Infrastructure.ajax_infra.add_member('show_elb', 'GET');
