var Dish = function () {
  var ajax_dish = new AjaxSet.Resources('dishes');
  ajax_dish.add_member('runlist', 'GET');

  this.runlist = function (id) {
    var dfd = $.Deferred();

    ajax_dish.runlist({id: id}).done(dfd.resolve).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };
};
