const loadGif = $('<div class="loader"></div>');
const glyphicon = function (icon_name) {
  return $('<span>').addClass(`glyphicon glyphicon-${icon_name}`);
};
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
  template: '\n<span data-toggle="tooltip" :data-placement="placement" :data-original-title="title">\n  <content class="content">\n    <slot name="content"></slot>\n  </content>\n</span>',
  mounted() {
    console.log(this);
    $(this.$el).tooltip();
  },
});
Vue.component('tr-helper', {
  template: '<tr><slot name="content"></slot><tr>',
});
const Loader = Vue.extend({
  template: '<span><div class="loader"></div> {{text}}</span>',
  data() {
    return {
      text: typeof t !== 'undefined' ? t('common.msg.loading') : '',
    };
  },
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
