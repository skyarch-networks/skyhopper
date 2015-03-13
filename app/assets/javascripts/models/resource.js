/**
 * @class Resource
 * @constructor
 */
var Resource = function (infra) {
  "use strict";

  var ajax = new AjaxSet.Resources('resources');



  this.index = function () {
    var dfd = $.Deferred();

    ajax.index({
      infra_id: infra.id,
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

  this.create = function (physical_id, screen_name) {
    var dfd = $.Deferred();

    ajax.create({
      infra_id:    infra.id,
      physical_id: physical_id,
      screen_name: screen_name,
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };
};
