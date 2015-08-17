/// <reference path="../../declares.d.ts" />
/// <reference path="./base.ts" />

class Dish  extends ModelBase {
  constructor(public id: string) {super(); }

  static ajax = new AjaxSet.Resources('dishes');


  runlist(id: number): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Dish.ajax).runlist({id: id})
    );
  }
}
Dish.ajax.add_member('runlist', 'GET');
