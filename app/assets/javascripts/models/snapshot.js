var Snapshot = function (infra_id) {
  "use strict";

  var self = this;

  var ajax_snapshot = new AjaxSet.Resources('snapshots');

  this.index = function (volume_id) {
    var dfd = $.Deferred();

    ajax_snapshot.index({
      infra_id: infra_id,
      volume_id: volume_id
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  }

  this.create = function (volume_id, physical_id) {
    var dfd = $.Deferred();

    ajax_snapshot.create({
      infra_id: infra_id,
      volume_id, volume_id,
      physical_id: physical_id
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  }

  this.destroy = function (snapshot_id) {
    var dfd = $.Deferred();

    ajax_snapshot.destroy({
      infra_id: infra_id,
      id: snapshot_id,
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  }

};
