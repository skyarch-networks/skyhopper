/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />
/// <reference path="./infrastructure.ts" />

class RDSInstance extends ModelBase {
  private params: {physical_id: string, id: string};

  constructor(private infra: Infrastructure, private physical_id: string) {
    super();
    this.params = {
      physical_id: physical_id,
      id:          infra.id,
    };
  }

  static ajax_infra = new AjaxSet.Resources('infrastructures');
  static ajax_serverspec = new AjaxSet.Resources('serverspecs');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>RDSInstance.ajax_infra).show_rds(this.params)
    );
  }

  change_scale(type: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>RDSInstance.ajax_infra).change_rds_scale(
        _.merge(this.params, {instance_type: type})
      )
    );
  }

  gen_serverspec(parameter: any): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>RDSInstance.ajax_serverspec).create_for_rds(
        _.merge({physical_id: this.physical_id, infra_id: this.infra.id}, parameter)
      )
    );
  }
}

RDSInstance.ajax_infra.add_member('show_rds', 'GET');
RDSInstance.ajax_infra.add_member('change_rds_scale', 'POST');

RDSInstance.ajax_serverspec.add_collection('create_for_rds', 'PUT');
