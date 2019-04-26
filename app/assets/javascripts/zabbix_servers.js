//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(function () {
  'use_strict';


  if ($('#editElement').length) {
    require('./zabbix_servers/zabbix_edit')();
  }
  if ($('#indexElement').length) {
    require('./zabbix_servers/zabbix_index')();
  }
}());
