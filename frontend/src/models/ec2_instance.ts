//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />
/// <reference path="./infrastructure.ts" />
/// <reference path="./base.ts" />

class EC2Instance extends ModelBase {
  private params: {id: string; infra_id: string};
  constructor(private infra: Infrastructure, private physical_id: string) {
    super();
    this.params = {id: physical_id, infra_id: infra.id};
  }

  static ajax_node       = new AjaxSet.Resources('nodes');
  static ajax_ec2        = new AjaxSet.Resources('ec2_instances');
  static ajax_serverspec = new AjaxSet.Resources('serverspecs');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      EC2Instance.ajax_node.show(this.params)
    );
  }

  update(runlist: Array<any>): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      EC2Instance.ajax_node.update(_.merge(this.params, {runlist: runlist}))
    );
  }

  bootstrap(): JQueryPromise<any> {
    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_node).run_bootstrap(this.params)
      .done((data: any) => {
        const ws = ws_connector('bootstrap', this.physical_id);
        ws.onmessage = function (msg) {
          ws.close();

          const wsdata = JSON.parse(msg.data);
          if (wsdata.status) {
            dfd.resolve(wsdata.message);
          } else {
            dfd.reject(wsdata.message);
          }
        };
      })
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  watch_cook(dfd: JQueryDeferred<any>): JQueryDeferred<any> {
    const ws = ws_connector('cooks', this.physical_id);
    ws.onmessage = function (msg) {
      const data = JSON.parse(msg.data).v;
      if (typeof(data) === 'boolean') {
        // cook 終了
        // data が true ならば正常終了、false ならば異常終了
        ws.close();
        dfd.resolve(data);
      } else {
        dfd.notify('update', data + "\n");
      }
    };
    return dfd;
  }

  private _cook(method_name: string, params: any): JQueryPromise<any> {

    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_node)[method_name](params)
      .done( (data: string) => {
        dfd.notify('start', data);
        this.watch_cook(dfd);
      })
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  cook(params: any) {
    return this._cook('cook', _.merge(this.params, params));
  }

  yum_update(security: boolean, exec: boolean): JQueryPromise<any> {
    const extra_params = {
      security: security ? 'security' : 'all',
      exec:     exec     ? 'exec'     : 'check',
    };
    const params = _.merge(this.params, extra_params);

    return this._cook('yum_update', params);
  }

  apply_dish(dish_id: number) {
    const params = _.merge(this.params, dish_id ? {dish_id: dish_id} : {});
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_node).apply_dish(params)
    );
  }

  edit(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      EC2Instance.ajax_node.edit(this.params)
    );
  }

  edit_attributes(): JQueryPromise<any> {
    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_node).edit_attributes(this.params)
      .done((data: any) => {
        _.forEach(data, (val: {type: string; input_type: string}) => {
          val.input_type = val.type === 'Boolean' ? 'checkbox' : 'text';
        });
        dfd.resolve(data);
      })
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  update_attributes(attributes: {[key: string]: {value: any}}): JQueryPromise<any> {
    const req: {[key: string]: any} = {};
    _.forEach(attributes, (v, key) => {
      req[key] = v.value;
    });

    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_node).update_attributes(
        _.merge(this.params, {attributes: JSON.stringify(req)})
      )
    );
  }

  // XXX: schedule ってどんな型?
  schedule_yum(schedule: any): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_node).schedule_yum(_.merge(this.params, {
        physical_id: this.physical_id,
        infra_id:    this.infra.id,
        schedule:    schedule,
      }))
    );
  }

  recipes(cookbook: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_node).recipes({ cookbook: cookbook })
    );
  }

  select_serverspec(): JQueryPromise<any> {
    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_serverspec).select({
      physical_id: this.physical_id,
      infra_id:    this.infra.id,
    }).done((data: any) => {
      _.forEach(data.globals, (s: any) => {
        s.checked = _.include(data.selected_ids, s.id);
      });
      _.forEach(data.individuals, (s: any) => {
        s.checked = false;
      });
      dfd.resolve(data);
    }).fail(this.rejectF(dfd));

    return dfd.promise();
  }

  run_serverspec(specs: any, auto: boolean): JQueryPromise<any> {
    const dfd = $.Deferred();

    const ids = _(specs).filter((v: any) => {
      return v.checked;
    }).pluck('id').value();

    if (auto) {
      ids.push(-1);
    }

    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_serverspec).run({
        physical_id:    this.physical_id,
        infra_id:       this.infra.id,
        serverspec_ids: ids,
      })
    );
  }

  schedule_serverspec(schedule: any): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_serverspec).schedule({
        physical_id: this.physical_id,
        infra_id:    this.infra.id,
        schedule:    schedule,
      })
    );
  }

  change_scale(type: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_ec2).change_scale(
        _.merge(this.params, {instance_type: type})
      )
    );
  }

  // ec2 のステータス変更をWebSocketで待ち受けて、dfdをrejectかresolveする function を返す
  private wait_change_status(dfd: JQueryDeferred<any>): () => void {
    return () => {
      const ws = ws_connector('ec2_status', this.physical_id);
      ws.onmessage = function (msg) {
        const d = JSON.parse(msg.data);
        if (d.error) {
          dfd.reject(d.error.message);
        } else {
          dfd.resolve(d.msg);
        }
        ws.close();
      };
    };
  }

  start_ec2(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_ec2).start(this.params)
    );
  }

  stop_ec2(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_ec2).stop(this.params)
    );
  }

  reboot_ec2(): JQueryPromise<any> {
    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_ec2).reboot(this.params)
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  serverspec_status(): JQueryPromise<any> {
    const dfd = $.Deferred();

    (<any>EC2Instance.ajax_ec2).serverspec_status(this.params)
      .done((data: any) => {
        dfd.resolve(data.status);
      }).fail(this.rejectF(dfd));

    return dfd.promise();
  }

  register(elb_name: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_ec2).register_to_elb(_.merge(this.params, {elb_name: elb_name}))
    );
  }

  deregister(elb_name: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>EC2Instance.ajax_ec2).deregister_from_elb(_.merge(this.params, {elb_name: elb_name}))
    );
  }
}


EC2Instance.ajax_node.add_member('cook', 'PUT');
EC2Instance.ajax_node.add_member('yum_update', 'PUT');
EC2Instance.ajax_node.add_member('run_bootstrap', 'GET');
EC2Instance.ajax_node.add_member('apply_dish', 'POST');
EC2Instance.ajax_node.add_member('edit_attributes', 'GET');
EC2Instance.ajax_node.add_member('update_attributes', 'PUT');
EC2Instance.ajax_node.add_member('schedule_yum', 'POST');
EC2Instance.ajax_node.add_collection('recipes', 'GET');

EC2Instance.ajax_ec2.add_member('change_scale', 'POST');
EC2Instance.ajax_ec2.add_member("start", "POST");
EC2Instance.ajax_ec2.add_member("stop", "POST");
EC2Instance.ajax_ec2.add_member("reboot", "POST");
EC2Instance.ajax_ec2.add_member('serverspec_status', 'GET');
EC2Instance.ajax_ec2.add_member('register_to_elb', 'POST');
EC2Instance.ajax_ec2.add_member('deregister_from_elb', 'POST');

EC2Instance.ajax_serverspec.add_collection('select', 'GET');
EC2Instance.ajax_serverspec.add_collection("run", "POST");
EC2Instance.ajax_serverspec.add_collection('schedule', 'POST');
