#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationDuration < ApplicationRecord
  belongs_to :resource
  belongs_to :user
  has_one :recurring_date
end
