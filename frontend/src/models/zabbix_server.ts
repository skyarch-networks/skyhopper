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
  constructor(public id: string) {super(); }

  static ajax = new AjaxSet.Resources('zabbix_servers');


  /**
   * @method \create zabbix
   * @param {Object} data
   * @return {$.Promise}
   */
  create(data: {
    fqdn:   string;
    username: string;
    password:  string;
    params: Array<any>; // XXX: Array だっけ?
  }): JQueryPromise<any> {
    return this.WrapAndResolveReject((dfd) => {
      if (data.name === "") {
        dfd.reject(t('infrastructures.msg.empty_subject'));
      }

      const req = {cf_template: {
        name:              data.name,
        detail:            data.detail,
        value:             data.value,
        params:            data.params,
        infrastructure_id: this.infra.id,
      }};

      return (<any>ZabbixServer.ajax).create(req);
    });
  }
}
ZabbixServer.ajax.add_collection('create', 'POST');
