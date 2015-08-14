/// <reference path="../../declares.d.ts" />
/// <reference path="./infrastructure.ts" />
/// <reference path="./base.ts" />

type MasterMonitoring = {
  id: number,
  name: string,
  item: string,
  trigger_expression: string,
  is_common: boolean,
  value: any,
  checked: boolean,
};

class Monitoring extends ModelBase {
  constructor(private infra: Infrastructure) { super(); }

  static ajax = new AjaxSet.Resources('monitorings');

  static type(master: MasterMonitoring): string {
    if (master.name === 'URL') {
      return 'url';
    } else if (master.name === 'MySQL') {
      return 'mysql';
    } else if (master.name === 'PostgreSQL') {
      return 'postgresql';
    } else if (master.name === "HTTP" || master.name === "SMTP" || master.name === "BASICS") {
      return 'no_trigger';
    }
    return 'trigger';
  }

  create_host(templates: any[] = []): JQueryPromise<any> {


    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).create_host({
      templates: templates,
      id: this.infra.id
      })
    );
  }

  edit(): JQueryPromise<any> {
    const dfd = $.Deferred();

    Monitoring.ajax.edit({id: this.infra.id}).done((data: any) => {
      _.forEach(data.master_monitorings, (m: MasterMonitoring) => {
        const selected = !!_.find(data.selected_monitoring_ids, (id) => id === m.id);
        m.checked = selected;

        if (Monitoring.type(m) === 'trigger') {
          const expr: string = data.trigger_expressions[m.item];
          const v = parseInt(expr.replace(m.trigger_expression, '').replace(/[A-Z]/, ''));
          m.value = v;
        } else if (Monitoring.type(m) === 'mysql') {
          const re = /^mysql.login\[(.+)\]/;
          const key = (<any>_).findKey(data.trigger_expressions, (_: any, key: any) => re.test(key));
          if (key) {
            m.value = key.match(re)[1];
          } else {
            m.value = '';
          }
        }
      });
      if (!data.web_scenarios) {
        data.web_scenarios = [];
      }
      dfd.resolve(data);
    }).fail(this.rejectF);

    return dfd.promise();
  }

  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Monitoring.ajax.show({id: this.infra.id})
    );
  }

  update(master_monitorings: MasterMonitoring[], web_scenario: any[] = []): JQueryPromise<any> {
    const selected_monitorings = _.filter(master_monitorings, (m) => m.checked);

    let exprs: any = [];
    const host_mysql: any      = {};
    const host_postgresql: any = {};

    _.forEach(selected_monitorings, (m) => {
      if (Monitoring.type(m) === 'trigger') {
        exprs.push([m.id, m.value]);
      } else if (Monitoring.type(m) === 'mysql') {
        host_mysql.id   = m.id;
        host_mysql.host = m.value || null;
      } else if (Monitoring.type(m) === 'postgresql') {
        host_postgresql.id   = m.id;
        host_postgresql.host = m.value || null;
      }
    });

    const ids = _.pluck(selected_monitorings, 'id');

    return this.WrapAndResolveReject(() =>
      Monitoring.ajax.update({
        id:              this.infra.id,
        web_scenario:    JSON.stringify(web_scenario),
        monitoring_ids:  ids,
        expressions:     JSON.stringify(exprs),
        host_mysql:      JSON.stringify(host_mysql),
        host_postgresql: JSON.stringify(host_postgresql),
      })
    );
  }

  show_problems(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).show_problems({id: this.infra.id})
    );
  }

  show_url(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).show_url_status({id: this.infra.id})
    );
  }


  show_zabbix_graph(physical_id: string, item_key: any): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).show_zabbix_graph({
        id:          this.infra.id,
        physical_id: physical_id,
        item_key:    item_key,
      })
    );
  }

  show_cloudwatch_graph(physical_id: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Monitoring.ajax).show_cloudwatch_graph({
        id: this.infra.id,
        physical_id: physical_id,
      })
    );
  }
}

Monitoring.ajax.add_member('create_host',  'POST');
Monitoring.ajax.add_member("show_cloudwatch_graph", "GET");
Monitoring.ajax.add_member("show_problems", "GET");
Monitoring.ajax.add_member("show_url_status", "GET");
Monitoring.ajax.add_collection("show_zabbix_graph", "GET");
