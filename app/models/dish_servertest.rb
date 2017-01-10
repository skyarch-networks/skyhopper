#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DishServertest < ActiveRecord::Base
  belongs_to :dish,       dependent: :destroy
  belongs_to :servertest, dependent: :destroy
end
