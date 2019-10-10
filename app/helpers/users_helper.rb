#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module UsersHelper
  def label_its_you(user)
    return '' unless current_user.id == user.id

    '<span class="label label-success">It\'s you</span>'.html_safe if current_user.id == user.id
  end
end
