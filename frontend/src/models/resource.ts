/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />
/// <reference path="./infrastructure.ts" />

class Resource extends ModelBase{
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
