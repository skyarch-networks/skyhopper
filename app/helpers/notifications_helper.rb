#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module NotificationsHelper
  def create_notification(text, status, timestamp)
    klass = ['notification-panel', 'bs-callout', "bs-callout-#{status ? 'success' : 'danger'}"]
    content = content_tag('h5', timestamp) + content_tag('p', text)
    return content_tag('div', simple_format(content), class: klass.join(' '))
  end
end
