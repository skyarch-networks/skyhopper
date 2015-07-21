/// <reference path="../../declares.d.ts" />

class Dish {
  static ajax = new AjaxSet.Resources('dishes');


  runlist(id: number) {
    const dfd = $.Deferred();

    (<any>Dish.ajax).runlist({
      id: id,
    }).done(dfd.resolve)
      .fail((xhr: XMLHttpRequest) => {dfd.reject(xhr.responseText); });

    return dfd.promise();
  }
}
Dish.ajax.add_member('runlist', 'GET');
