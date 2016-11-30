//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  "use strict";
  var modal = require('modal');

  var form = document.forms['set_knife'];
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    modal.Confirm(t('app_settings.chef_server'), t('chef_servers.msg.set_knife_instruction')).done(function () {
      form.submit();
    });
  });
})();
