//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

exports.install = (Vue, lang) => {
  Vue.directive('datepicker', {

    bind(el, binding, vnode) {
      // var vm = this.vm;
      const keypath = binding.expression.split('.');
      moment.locale(lang);
      const dp = $(el).datetimepicker({
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
      dp.on('dp.change', (e) => {
        const startDate = moment(e.date._d).format('YYYY/MM/D H:mm'); // eslint-disable-line no-underscore-dangle
        const startDateUnix = moment(e.date._d).unix(); // eslint-disable-line no-underscore-dangle
        if (e.target.id !== 'op-sched-start' && e.target.id !== 'op-sched-end') {
          dp.data('DateTimePicker').maxDate('now');
          Vue.set(vnode.context[keypath[0]], keypath[1], startDateUnix);
        } else {
          Vue.set(vnode.context[keypath[0]], keypath[1], startDate);
        }

        // Sets the start vallue into a hidden type form to be able to let end picker to acces it
        if (e.target.placeholder === 'Start' || e.target.id === 'op-sched-start') $("input[type='hidden']").val(startDate).change();
      });

      // Gets the start value and set the Minimum Date
      dp.on('dp.show', (e) => {
        if (e.target.placeholder === 'End' || e.target.id === 'op-sched-end') {
          const minDate = $("input[type='hidden']").val();
          dp.data('DateTimePicker').minDate(minDate);
        }
      });

      dp.on('dp.error', (e) => {
        const oldDate = moment(e.oldDate._d).format('YYYY/MM/D H:mm'); // eslint-disable-line no-underscore-dangle
        const oldDateUnix = moment(e.oldDate._d).unix(); // eslint-disable-line no-underscore-dangle
        if (e.target.id !== 'op-sched-start' && e.target.id !== 'op-sched-end') {
          Vue.set(vnode.context[keypath[0]], keypath[1], oldDateUnix);
        } else {
          Vue.set(vnode.context[keypath[0]], keypath[1], oldDate);
        }
      });
    },
    update(el, binding, vnode) {
      const tagId = `#${String(el.id)}`;
      const ops = ['op-sched-end', 'op-sched-start'];
      const picker = ops.includes(String(el.id)) ? $(`${tagId} .datetimepicker3`) : $(tagId);

      picker.datetimepicker('setDate', binding.value);
      // var vm = this.vm;
      const keypath = binding.expression.split('.');
      Vue.set(vnode.context[keypath[0]], keypath[1], binding.value);
    },
  });
};
