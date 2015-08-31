/// <reference path="../../declares.d.ts" />
/// <reference path="./infrastructure.ts" />
/// <reference path="./base.ts" />

class S3Bucket extends ModelBase {
  constructor(private infra: Infrastructure, private physical_id: string) {super(); }

  static ajax = new AjaxSet.Resources('infrastructures');


  show(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>S3Bucket.ajax).show_s3({
        bucket_name: this.physical_id,
        id: this.infra.id,
      })
    );
  }
}

S3Bucket.ajax.add_member("show_s3", "GET");
