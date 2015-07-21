/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../ajax_set.d.ts" />

class Infrastructure {
  constructor(public id: string) {}

  show(): JQueryPromise<any> {
    var dfd = $.Deferred();

    Infrastructure.ajax_infra.show({
      id: this.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.progress();
  }

  detach(): JQueryPromise<any> {
    var dfd = $.Deferred();

    Infrastructure.ajax_infra.destroy({
      id: this.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  delete_stack(): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>Infrastructure.ajax_infra).delete_stack({
      id: this.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  stack_events(): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>Infrastructure.ajax_infra).stack_events({
      id: this.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  logs(page = 1): JQueryPromise<any> {
    var dfd = $.Deferred();

    $.ajax({
      url: '/infrastructure_logs',
      data: {
        infrastructure_id: this.id,
        page: page,
      },
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  show_elb(physical_id: string): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>Infrastructure.ajax_infra).show_elb({
      id:          this.id,
      pyhsical_id: physical_id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  static ajax_infra    = new AjaxSet.Resources('infrastructures');
  static ajax_resource = new AjaxSet.Resources('resources');

  private resolveF(dfd: JQueryDeferred<any>) {
    return (data: any) => dfd.resolve(data);
  }

  private rejectF(dfd: JQueryDeferred<any>) {
    return (xhr: XMLHttpRequest) => dfd.reject(xhr.responseText);
  }
}

Infrastructure.ajax_infra.add_member('delete_stack', 'POST');
Infrastructure.ajax_infra.add_member('stack_events', 'GET');
Infrastructure.ajax_infra.add_member('show_elb', 'GET');
