const ModelBase = require('./base').default;

const Dish = class Dish extends ModelBase {
  constructor(id) {
    super();
    this.id = id;
    this.ajax = new AjaxSet.Resources('dishes');
    this.ajax.add_member('runlist', 'GET');
  }

  runlist(id) {
    return this.WrapAndResolveReject(
      () => this.ajax.runlist({ id }),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Dish;
