//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../declares.d.ts" />
const loadGif = $('<div class="loader"></div>');

// helper of glyphicon
const glyphicon = function (icon_name: string): JQuery {
  return $("<span>").addClass("glyphicon glyphicon-" + icon_name);
};



// <bootstrap-tooltip title="tooltip title">
//   <div>Your content</div>
// </bootstrap-tooltip>
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
<span data-toggle="tooltip" data-placement="{{placement}}" data-original-title="{{title}}">
  <content class="content">
    <slot name="content"></slot>
  </content>
</span>`,
  compiled: function () {
    console.log(this);
    $(this.$el).tooltip();
  },
});

Vue.component('tr-helper', {
  template: `<tr><slot name="content"></slot><tr>`,
});

const Loader = Vue.extend({
  template: '<span><div class="loader"></div> {{text}}</span>',
  data: function () { return {
    // XXX: When test, t is undefined...
    text: typeof t !== 'undefined' ? t('common.msg.loading') : "",
  }},
});

Vue.component('div-loader', {
  template: '<span><div class="loader"></div> {{text}}</span>',
  props: {
    text: {
      type: String,
      // XXX: When test, t is undefined...
      default: typeof t !== 'undefined' ? t('common.msg.loading') : "",
    },
  },
});
