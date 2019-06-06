//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const zabbixIndex = require('./zabbix_servers/zabbix_index');
const zabbixEdit = require('./zabbix_servers/zabbix_edit');

(() => {
  'use_strict';


  if ($('#editElement').length) {
    zabbixEdit();
  }
  if ($('#indexElement').length) {
    zabbixIndex();
  }
})();
