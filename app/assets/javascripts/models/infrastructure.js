var Infrastructure = function (infra_id) {
  'use strict';

  this.id = infra_id;

  var self = this;

  var ajax_infra = new AjaxSet.Resources('infrastructures');
  ajax_infra.add_member('delete_stack', 'POST');
  ajax_infra.add_member('stack_events', 'GET');
  ajax_infra.add_collection('cloudformation_status', 'GET');
  ajax_infra.add_collection('change_rds_scale', 'POST');

  var ajax_resources = new AjaxSet.Resources('resources');

  this.show = function () {
    var dfd = $.Deferred();

    ajax_infra.show({
      id: self.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

  this.detach = function () {
    var dfd = $.Deferred();

    ajax_infra.destroy({
      id: self.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (data, status, xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

  this.delete_stack = function () {
    var dfd = $.Deferred();

    ajax_infra.delete_stack({
      id: self.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

  this.stack_events = function () {
    var dfd = $.Deferred();

    ajax_infra.stack_events({
      id: self.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };


  this.logs = function (page) {
    page = page || 1;
    var dfd = $.Deferred();
    $.ajax({
      url: '/infrastructure_logs',
      data: {
        infrastructure_id: infra_id,
        page: page,
      },
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };
};
