//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase from './base';

export default class ZabbixServer extends ModelBase {
  constructor(public session_id: string) {super(); }

  static ajax = new AjaxSet.Resources('zabbix_servers');

  create(fqdn: string, username: string, password: string, details: string, lang: string): JQueryPromise<any> {
    const dfd = $.Deferred();
    (<any>ZabbixServer.ajax).create({
      zabbix_server: {
        fqdn:             fqdn,
        username:         username,
        password:         password,
        details:          details
      },
      lang: lang,
      commit: "Create Zabbix Server",
    })
      .done(this.wait_change_status(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  // ec2 のステータス変更をWebSocketで待ち受けて、dfdをrejectかresolveする function を返す
  private wait_change_status(dfd: JQueryDeferred<any>): () => void {
    return () => {
      const ws = ws_connector('notifications', this.session_id);
      ws.onmessage = function (msg) {
        const d = JSON.parse(msg.data);
        if (!d.status) {
          dfd.reject(d.message);
        } else {
          dfd.resolve(d);
        }
        ws.close();
      };
    };
  }
}
