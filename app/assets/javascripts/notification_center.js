//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {

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
      speed: 200 // opening & closing animation speed
    },
    timeout: false, // delay for closing event. Set false for sticky notifications
    force: false, // adds notification to the beginning of queue when set to true
    modal: false,
    maxVisible: 7, // you can set max visible notification for dismissQueue true option,
    killer: false, // for close all notifications before show
    closeWith: ['click', 'button'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications
    callback: {
      onShow: function() {},
      afterShow: function() {},
      onClose: function() {},
      afterClose: function() {},
      onCloseClick: function() {},
    },
    buttons: false // an array of buttons
  };


  var ws_conn = ws_connector('notifications', session_id);

  ws_conn.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    var status = data.status ? "success" : "danger";
    var status_noty = data.status ? "success" : "error";

    display_notification(data.message, status, data.timestamp, status_noty);
  };



  var favicon_badge_count = 0;
  var favicon = new Favico();

  var display_notification = function (message, status, timestamp, status_noty) {
    var notification_status =  "notification-panel bs-callout bs-callout-" + status;

    var header = $('<h5>', {text: timestamp});
    var content = $('<div>', {html: message.replace(/[\n\r]/g, "<br />")});

    $("div#notification").prepend( $("<div>", {class: notification_status, role: "alert"}).append(header).append(content) );

    // 10個以上なら消す
    while ($(".notification-panel").length > 10) {
      $(".notification-panel:last").remove();
    }

    favicon.badge(++favicon_badge_count);
    var notification_noty = noty({
      text: message,
      type: status_noty,
      callback: {
        onClose: function() {
          if (favicon_badge_count !== 0) {
            favicon.badge(--favicon_badge_count);
          }
        }
      }
    });
  };


  var refresh_notifications = function () {
    favicon_badge_count = 0;
    favicon.badge(favicon_badge_count);
    $.noty.closeAll();
  };

  $(document).on('click', "#close-notification-center", function () {
    refresh_notifications();
  });


  $(window).on('focus', refresh_notifications);


})();
