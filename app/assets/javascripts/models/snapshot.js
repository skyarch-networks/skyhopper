var Snapshot = function (infra_id) {
  "use strict";

  var self = this;

  var ajax_snapshot = new AjaxSet.Resources('snapshots');
  ajax_snapshot.add_collection('schedule', 'POST');

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
  };

  var watch_snapshot_progress = function (dfd) {
    return function (data) {
      var ws = ws_connector('snapshot_status', data.snapshot_id);
      ws.onmessage = function (msg) {
        if (msg.data === 'completed') {
          dfd.resolve(data);
          ws.close();
        };
      };
    };
  };

  this.create = function (volume_id, physical_id) {
    var dfd = $.Deferred();

    ajax_snapshot.create({
      infra_id: infra_id,
      volume_id, volume_id,
      physical_id: physical_id
    }).done(function (data) {
      watch_snapshot_progress(dfd)(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

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
  };

  this.schedule = function (volume_id, physical_id, schedule) {
    var dfd = $.Deferred();

    ajax_snapshot.schedule({
      infra_id: infra_id,
      volume_id, volume_id,
      physical_id: physical_id,
      schedule, schedule
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

};
