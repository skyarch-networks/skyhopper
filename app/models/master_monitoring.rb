#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class MasterMonitoring < ApplicationRecord
  validates :name, uniqueness: true
  validates :item, uniqueness: true, allow_nil: true

  has_many :monitorings
  has_many :infrastructures, through: :monitorings
end
