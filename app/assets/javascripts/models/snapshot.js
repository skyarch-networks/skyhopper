var Snapshot = function (infra_id) {
  "use strict";

  var self = this;

  var ajax_snapshot = new AjaxSet.Resources('snapshots');

  this.create = function (volume_id) {
    var dfd = $.Deferred();

    ajax_snapshot.create({
      infra_id: infra_id,
      volume_id, volume_id
    }).done(function (data) {
      dfd.resolve(data);
    });

    return dfd.promise();
  }

};
