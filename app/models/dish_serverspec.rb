#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DishServerspec < ActiveRecord::Base
  belongs_to :dish,       dependent: :destroy
  belongs_to :serverspec, dependent: :destroy
end
