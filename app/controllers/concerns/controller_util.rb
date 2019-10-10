#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module Concerns::ControllerUtil
  def redirect_to_back_or_root
    redirect_back(fallback_location: root_path) and return
  end
end
