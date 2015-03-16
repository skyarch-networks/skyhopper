var RDSInstance = function (infra, physical_id) {
  "use strict";

  this.physical_id = physical_id;

  var self = this;



  var ajax_infra = new AjaxSet.Resources('infrastructures');
  ajax_infra.add_member('show_rds', 'GET');
  ajax_infra.add_member('change_rds_scale', 'POST');

  var ajax_serverspec = new AjaxSet.Resources('serverspecs');
  ajax_serverspec.add_collection('create_for_rds', 'PUT');

  var params = {
    physical_id: physical_id,
    id:          infra.id
  };

  // TODO: DRY
  var rejectXHR = function (dfd) {
    return function (xhr) {
      dfd.reject(xhr.responseText);
    };
  };

  this.show = function () {
    var dfd = $.Deferred();

    ajax_infra.show_rds(params)
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.change_scale = function (type) {
    var dfd = $.Deferred();

    ajax_infra.change_rds_scale(_.merge(params, {instance_type: type}))
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  // ==== Arguments
  // - parameter {user: String, password: String, database: String(Optional)}
  this.gen_serverspec = function (parameter) {
    var dfd = $.Deferred();

    ajax_serverspec.create_for_rds(_.merge({physical_id: physical_id, infra_id: infra.id}, parameter))
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));
    return dfd.promise();
  };
};
