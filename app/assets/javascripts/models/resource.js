const ModelBase = require('./base').default;

const Resource = class Resource extends ModelBase {
  constructor(infra) {
    super();
    this.infra = infra;
    this.ajax = new AjaxSet.Resources('resources');
  }

  index() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax.index({ infra_id: self.infra.id }),
    );
  }

  create(physicalId, screenName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax.create({
        infra_id: self.infra.id,
        physical_id: physicalId,
        screen_name: screenName,
      }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Resource;
