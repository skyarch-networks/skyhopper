exports.install = function(Vue, lang){

  Vue.directive('timepicker', {
    twoWay: true,

    bind: function () {
      var vm = this.vm;
      var key = this.expression;
      var dp = $(this.el).datetimepicker({
        //format: 'YYYY/MM/D h:mm a',
        format: 'hh:mm a',
        showTodayButton: true,
        locale: lang,
        tooltips: {
          today: t('datepicker.today'),
          selectTime: t('datepicker.selectTime'),
          selectMonth: t('datepicker.selectMonth'),
          togglePeriod: t('datepicker.togglePeriod'),
          incrementMinute: t('datepicker.incrementMinute'),
          decrementMinute: t('datepicker.decrementMinute'),
          pickMinute: t('datepicker.pickMinute'),
          incrementHour: t('datepicker.incrementHour'),
          decrementHour: t('datepicker.decrementHour'),
          pickHour: t('datepicker.pickHour'),
        },
      });
      dp.on("dp.change", function (e) {
        vm.$set(key, moment(e.date._d).unix());

        var current = new Date();
        if(e.target.placeholder === "Start")
          $("input[type='hidden']").val(e.date._d);
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
