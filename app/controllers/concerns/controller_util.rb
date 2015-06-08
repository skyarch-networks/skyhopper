#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module Concerns::ControllerUtil
  def redirect_to_back_or_root
    if request.headers[:HTTP_REFERER].present?
      redirect_to :back and return
    else
      redirect_to root_path and return
    end
  end
end
