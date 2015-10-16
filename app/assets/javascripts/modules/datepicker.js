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


        var current = new Date();
        if(e.target.id !== "op-sched"){
          dp.data("DateTimePicker").maxDate(current);
          vm.$set(key, moment(e.date._d).unix());
        }else{
          vm.$set(key, moment(e.date._d).format('YYYY/MM/D h:mm a'));
        }
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
