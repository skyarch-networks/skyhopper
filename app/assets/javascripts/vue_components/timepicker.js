//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

exports.install = function(Vue, lang){

  Vue.directive('timepicker', {
    twoWay: true,

    bind: function () {
      var vm = this.vm;
      var key = this.expression;
      var dp = $(this.el).datetimepicker({
        format: 'LT',
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
          vm.$set(key, moment(e.date._d).format('h:mm a'));
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
