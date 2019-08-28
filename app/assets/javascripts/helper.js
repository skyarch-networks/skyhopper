Vue.component('bootstrap-tooltip', {
  props: {
    title: {
      type: String,
      required: true,
    },
    placement: {
      type: String,
      required: false,
    },
  },
  template: `
<span data-toggle="tooltip" :data-placement="placement" :data-original-title="title">
  <content class="content">
    <slot name="content"></slot>
  </content>
</span>`,
  mounted() {
    $(this.$el).tooltip();
  },
});
Vue.component('tr-helper', {
  template: '<tr><slot name="content"></slot><tr>',
});
Vue.component('div-loader', {
  template: '<span><div class="loader"></div> {{text}}</span>',
  props: {
    text: {
      type: String,
      default: typeof t !== 'undefined' ? t('common.msg.loading') : '',
    },
  },
});
