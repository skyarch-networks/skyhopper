const ModelBase = require('./base').default;

const Monitoring = class Monitoring extends ModelBase {
  constructor(infra) {
    super();
    this.infra = infra;
    this.ajax = new AjaxSet.Resources('monitorings');
    this.ajax.add_member('create_host', 'POST');
    this.ajax.add_member('update_templates', 'POST');
    this.ajax.add_member('change_zabbix_server', 'POST');
    this.ajax.add_member('show_cloudwatch_graph', 'GET');
    this.ajax.add_member('show_problems', 'GET');
    this.ajax.add_member('show_url_status', 'GET');
    this.ajax.add_collection('show_zabbix_graph', 'GET');
  }

  static type(master) {
    if (master.name === 'URL') {
      return 'url';
    }
    if (master.name === 'MySQL') {
      return 'mysql';
    }
    if (master.name === 'PostgreSQL') {
      return 'postgresql';
    }
    if (master.name === 'HTTP' || master.name === 'SMTP' || master.name === 'BASICS') {
      return 'no_trigger';
    }
    return 'trigger';
  }

  create_host(_templates) {
    const self = this;
    const templates = (_templates === undefined) ? [] : _templates;
    return this.WrapAndResolveReject(
      () => this.ajax.create_host({
        templates,
        id: self.infra.id,
      }),
    );
  }

  update_templates(physicalId, _templates) {
    const self = this;
    const templates = (_templates === undefined) ? [] : _templates;
    return this.WrapAndResolveReject(
      () => this.ajax.update_templates({
        templates,
        physical_id: physicalId,
        id: self.infra.id,
      }),
    );
  }

  change_zabbix_server(zabbixId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.change_zabbix_server({
        zabbix_id: zabbixId,
        id: self.infra.id,
      }),
    );
  }

  edit() {
    const dfd = $.Deferred();
    this.ajax.edit({ id: this.infra.id }).done((data) => {
      data.master_monitorings.forEach((_m) => {
        const m = _m;
        const selected = !!data.selected_monitoring_ids.find(
          id => id === m.id,
        );
        m.checked = selected;
        if (Monitoring.type(m) === 'trigger') {
          const expr = data.trigger_expressions[m.item];
          const v = parseInt(expr.replace(m.trigger_expression, '').replace(/[A-Z]/, ''), 10);
          m.value = v;
        } else if (Monitoring.type(m) === 'mysql') {
          const re = /^mysql.login\[(.+)\]/;
          const key = Object.keys(data.trigger_expressions).find(
            targetKey => re.test(targetKey),
          );
          if (key) {
            // eslint-disable-next-line prefer-destructuring
            m.value = key.match(re)[1];
          } else {
            m.value = '';
          }
        }
      });
      if (!data.web_scenarios) {
        // eslint-disable-next-line no-param-reassign
        data.web_scenarios = [];
      }
      dfd.resolve(data);
    }).fail(dfd.reject);
    return dfd.promise();
  }

  show() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.show({ id: self.infra.id }),
    );
  }

  update(masterMonitorings, _webScenario) {
    const self = this;
    const webScenario = (_webScenario === undefined) ? [] : _webScenario;
    const selectedMonitorings = masterMonitorings.filter(m => m.checked);
    const exprs = [];
    const hostMysql = {};
    const hostPostgresql = {};
    selectedMonitorings.forEach((m) => {
      if (Monitoring.type(m) === 'trigger') {
        exprs.push([m.id, m.value]);
      } else if (Monitoring.type(m) === 'mysql') {
        hostMysql.id = m.id;
        hostMysql.host = m.value || null;
      } else if (Monitoring.type(m) === 'postgresql') {
        hostPostgresql.id = m.id;
        hostPostgresql.host = m.value || null;
      }
    });
    const ids = selectedMonitorings.map(m => m.id);
    return this.WrapAndResolveReject(
      () => this.ajax.update({
        id: self.infra.id,
        web_scenario: JSON.stringify(webScenario),
        monitoring_ids: ids,
        expressions: JSON.stringify(exprs),
        host_mysql: JSON.stringify(hostMysql),
        host_postgresql: JSON.stringify(hostPostgresql),
      }),
    );
  }

  show_problems() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.show_problems({ id: self.infra.id }),
    );
  }

  show_url() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.show_url_status({ id: self.infra.id }),
    );
  }

  show_zabbix_graph(physicalId, itemKey, dateRange) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.show_zabbix_graph({
        id: self.infra.id,
        physical_id: physicalId,
        item_key: itemKey,
        date_range: dateRange,
      }),
    );
  }

  show_cloudwatch_graph(physicalId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax.show_cloudwatch_graph({
        id: self.infra.id,
        physical_id: physicalId,
      }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Monitoring;
