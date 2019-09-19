//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(() => {
  $.noty.defaults = {
    layout: 'topRight',
    theme: 'relax', // or 'relax'
    type: 'alert',
    text: '', // can be html or string
    dismissQueue: true, // If you want to use queue feature set this true
    template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
    animation: {
      open: 'animated fadeIn', // or Animate.css class names like: 'animated bounceInLeft'
      close: 'animated fadeOut', // or Animate.css class names like: 'animated bounceOutLeft'
      easing: 'swing',
      speed: 200, // opening & closing animation speed
    },
    timeout: false, // delay for closing event. Set false for sticky notifications
    force: false, // adds notification to the beginning of queue when set to true
    modal: false,
    maxVisible: 7, // you can set max visible notification for dismissQueue true option,
    killer: false, // for close all notifications before show
    closeWith: ['click', 'button'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications
    callback: {
      onShow() {},
      afterShow() {},
      onClose() {},
      afterClose() {},
      onCloseClick() {},
    },
    buttons: false, // an array of buttons

  };


  if (session_id) {
    const ws_conn = wsConnector('notifications', session_id);

    ws_conn.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const status = data.status ? 'success' : 'danger';
      const statusNoty = data.status ? 'success' : 'error';

      displayNotification(data.message, status, data.timestamp, statusNoty);
    };
  }


  let faviconBadgeCount = 0;
  const favicon = new Favico();

  const displayNotification = (message, status, timestamp, statusNoty) => {
    const notificationStatus = `notification-panel bs-callout bs-callout-${status}`;

    const header = $('<h5>', { text: timestamp });
    const content = $('<div>', { text: message.replace(/[\n\r]/g, '<br />') });

    $('div#notification').prepend($('<div>', { class: notificationStatus, role: 'alert' }).append(header).append(content));

    // 10個以上なら消す
    while ($('.notification-panel').length > 10) {
      $('.notification-panel:last').remove();
    }

    favicon.badge(faviconBadgeCount += 1);
    noty({
      text: message,
      type: statusNoty,
      callback: {
        onClose() {
          if (faviconBadgeCount !== 0) {
            favicon.badge(faviconBadgeCount -= 1);
          }
        },
      },
    });
  };


  const refreshNotifications = () => {
    faviconBadgeCount = 0;
    favicon.badge(faviconBadgeCount);
    $.noty.closeAll();
  };

  $(document).on('click', '#close-notification-center', () => {
    refreshNotifications();
  });


  $(window).on('focus', refreshNotifications);
})();
