var S3Bucket = function (infra, physical_id) {
  "use strict";

  this.physical_id = physical_id;

  var self = this;



  var ajax_infra = new AjaxSet.Resources('infrastructures');
  ajax_infra.add_collection('show_s3', 'GET');

  this.show = function () {
    var dfd = $.Deferred();

    ajax_infra.show_s3({
      bucket_name: self.physical_id,
      infra_id: infra.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };
};
