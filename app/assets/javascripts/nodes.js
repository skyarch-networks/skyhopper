//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {



  var ajax_node = new AjaxSet.Resources("nodes");
  ajax_node.add_member('update_attributes', 'PUT');
  ajax_node.add_member("edit_attributes", "GET");


  var edit_attributes = function (physical_id, infra_id) {
    ajax_node.edit_attributes({
      id:       physical_id,
      infra_id: infra_id,
    }).done(function (data) {
      $('#'+physical_id).html(data);
    }).fail(function(xhr) {
      bootstrap_alert(t('infrastructures.infrastructure'), xhr.responseText, "danger");
    });
  };

  var update_attributes = function (physical_id, infra_id, attributes) {
    var json_attr = JSON.stringify(attributes);

    return ajax_node.update_attributes({
      id:         physical_id,
      infra_id:   infra_id,
      attributes: json_attr,
    });
  };


  var get_attributes = function () {
    var res = {};
    $('input.node-attributes').each(function (_, input) {
      var name = $(input).attr('name');
      var val  = $(input).val();
      res[name] = val;
    });

    return res;
  };


  $(document).on('click', '.edit-attributes', function (e) {
    e.preventDefault();

    var physical_id = current_physical_id();
    var infra_id    = current_infrastructure_id();

    edit_attributes(physical_id, infra_id);
  });

  $(document).on('click', '.update-attributes', function (e) {
    e.preventDefault();

    var physical_id = current_physical_id();
    var infra_id    = current_infrastructure_id();

    var attributes = get_attributes();

    update_attributes(physical_id, infra_id, attributes).done(function(msg) {
      bootstrap_alert(physical_id, msg).done(function() {
        show_ec2_instance(physical_id);
      });
    });
  });


})();
