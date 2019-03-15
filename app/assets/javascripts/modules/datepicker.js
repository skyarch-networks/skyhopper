//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

exports.install = function(Vue, lang){

  Vue.directive('datepicker', {

    bind: function (el,binding,vnode) {
      //var vm = this.vm;
      var keypath = binding.expression.split('.');
      moment.locale(lang);
      var dp = $(el).datetimepicker({
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
        var startDate =  moment(e.date._d).format('YYYY/MM/D H:mm');
        var startDateUnix = moment(e.date._d).unix();
        console.log(binding);
        if(e.target.id !== "op-sched-start" && e.target.id !== "op-sched-end"){
          dp.data("DateTimePicker").maxDate('now');
          vnode.context[keypath[0]][keypath[1]]=startDateUnix;
        }else{
          vnode.context[keypath[0]][keypath[1]]=startDate;
        }

        console.log(vnode.context);
        // Sets the start vallue into a hidden type form to be able to let end picker to acces it
        if(e.target.placeholder === "Start" || e.target.id === "op-sched-start")
          $("input[type='hidden']").val(startDate).change();

      });

      // Gets the start value and set the Minimum Date
      dp.on("dp.show", function (e) {
        if(e.target.placeholder === "End" || e.target.id === "op-sched-end"){
          var minDate = $("input[type='hidden']").val();
          dp.data("DateTimePicker").minDate(minDate);
        }
      });


    },
    update: function (el, binding, vnode) {
      var tag_id = "#"+String(el.id);
      var ops = ['op-sched-end', 'op-sched-start'];
      var picker = ops.includes(String(el.id)) ? $(tag_id+' .datetimepicker3') : $(tag_id);

      picker.datetimepicker('setDate', binding.val);
      //var vm = this.vm;
      var keypath = binding.expression.split('.');
      vnode.context[keypath[0]][keypath[1]]=binding.val;
    }
  });
};
