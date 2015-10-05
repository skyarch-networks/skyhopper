exports.install = function(Vue, lang){

  Vue.directive('datepicker', {
    twoWay: true,

    bind: function () {
      var vm = this.vm;
      var key = this.expression;
      var dp = $(this.el).datetimepicker({
        format: 'YYYY/MM/D h:mm a',
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

        dp.data("DateTimePicker").maxDate(current);

        if(e.target.placeholder === "Start")
          $("input[type='hidden']").val(e.date._d);
      });

      dp.on("dp.show", function (e) {
        if(e.target.placeholder === "End"){
          var start = $("input[type='hidden']").val();
          var min = new Date(start);
          dp.data("DateTimePicker").minDate(min);
        }
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
