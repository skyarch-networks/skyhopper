const ModelBase = require('./base').default;

const ZabbixServer = class ZabbixServer extends ModelBase {
  constructor(sessionId) {
    super();
    this.session_id = sessionId;
    this.ajax = new AjaxSet.Resources('zabbix_servers');
  }

  create(zabbixServer) {
    const dfd = $.Deferred();
    this.ajax.create({
      zabbix_server: zabbixServer,
      lang: zabbixServer.lang,
      commit: 'Create Zabbix Server',
    })
      .done(this.wait_change_status(this.session_id, dfd, 'notifications'))
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  update(zabbixServer) {
    return this.WrapAndResolveReject(
      () => this.ajax.update({
        zabbix_server: zabbixServer, id: zabbixServer.id,
      }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ZabbixServer;
