#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module NotificationsHelper
  def create_notification(text, status, timestamp)
    klass = ['notification-panel', 'bs-callout', "bs-callout-#{status ? 'success' : 'danger'}"]
    text = simple_format(truncate(text, length: 140))
    content = content_tag('h5', timestamp) + content_tag('p', text)
    content_tag('div', content, class: klass.join(' '))
  end
end
