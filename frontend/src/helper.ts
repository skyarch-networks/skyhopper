//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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
  },
  template: `
<span data-toggle="tooltip" data-original-title="{{title}}">
  <content class="content">
    <slot name="content"></slot>
  </content>
</span>`,
  compiled: function () {
    console.log(this);
    $(this.$el).tooltip();
  },
});

const Loader = Vue.extend({
  template: '<span><div class="loader"></div> {{text}}</span>',
  props: {
    text: {
      type: String,
    },
  },
  data: () => {return {
    text: t('common.msg.loading'),
  }; },
});

Vue.component('div-loader', Loader);
