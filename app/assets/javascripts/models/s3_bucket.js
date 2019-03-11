const ModelBase = require('./base').default;

const S3Bucket = class S3Bucket extends ModelBase {
  constructor(infra, physicalId) {
    super();
    this.infra = infra;
    this.ajax = new AjaxSet.Resources('infrastructures');
    this.ajax.add_member('show_s3', 'GET');
    this.physical_id = physicalId;
  }

  show() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax.show_s3({
        bucket_name: self.physical_id,
        id: self.infra.id,
      }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = S3Bucket;
