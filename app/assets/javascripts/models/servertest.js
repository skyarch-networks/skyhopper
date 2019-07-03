const ModelBase = require('./base').default;

const Servertest = class Servertest extends ModelBase {
  constructor(infraId) {
    super();
    this.infra_id = infraId;
    this.ajax = new AjaxSet.Resources('servertests');
    this.ajax.add_collection('generate_awspec', 'GET');
  }

  create(fname, value, category) {
    return this.WrapAndResolveReject(
      () => this.ajax.create({
        servertest: {
          name: fname,
          value,
          infrastructure_id: self.infra_id,
          category,
        },
      }),
    );
  }

  generate_awspec() {
    const dfd = $.Deferred();
    this.ajax.generate_awspec({ infrastructure_id: this.infra_id })
      .done(this.wait_change_status(this.infra_id, dfd, 'awspec-generate'))
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Servertest;
