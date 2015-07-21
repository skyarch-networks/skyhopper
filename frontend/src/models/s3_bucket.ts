/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../ajax_set.d.ts" />
/// <reference path="infrastructure.ts" />

class S3Bucket {
  constructor(private infra: Infrastructure, private pyhsical_id: string) {}

  static ajax = new AjaxSet.Resources('infrastructures');

  show(): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>S3Bucket.ajax).show_s3({
      bucket_name: this.pyhsical_id,
      id: this.infra.id,
    }).done((data: any) => dfd.resolve(data))
      .fail((xhr: XMLHttpRequest) => dfd.reject(xhr.responseText));

    return dfd.promise();
  }
}

S3Bucket.ajax.add_member("show_s3", "GET");
