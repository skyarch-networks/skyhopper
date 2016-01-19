//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

exports.install = function(Vue, lang){

  Vue.directive('datepicker', {
    twoWay: true,

    bind: function () {
      var vm = this.vm;
      var key = this.expression;
      moment.locale(lang);
      var dp = $(this.el).datetimepicker({
        format: 'YYYY/MM/D H:mm',
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
        if(e.target.id !== "op-sched-start" && e.target.id !== "op-sched-end"){
          dp.data("DateTimePicker").maxDate(current);
          vm.$set(key, moment(e.date._d).unix());
        }else{
          vm.$set(key, moment(e.date._d).format('YYYY/MM/D H:mm'));
        }

        if(e.target.placeholder === "Start" || e.target.id === "op-sched-start")
          $("input[type='hidden']").val(e.date._d);

      });

      dp.on("dp.show", function (e) {
        if(e.target.placeholder === "End" || e.target.id === "op-sched-end")
          dp.data("DateTimePicker").minDate(new Date($("input[type='hidden']").val()));
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
