exports.install = function(Vue, lang){

  Vue.directive('datepicker', {
    twoWay: true,
    bind: function () {
      var vm = this.vm;
      var key = this.expression;
      var dp = $(this.el).datetimepicker({
        locale: lang,
        sideBySide: true,
      });

      dp.on("dp.change", function (e) {

         vm.$set(key, moment(e.date._d).unix());
         var current = new Date();
         dp.data("DateTimePicker").maxDate(current);
      });
    },
    update: function (val) {
      $(this.el).datetimepicker('setDate', val);
      var vm = this.vm;
      var key = this.expression;
      vm.$set(key, val);
    }
  });
};
