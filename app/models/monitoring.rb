#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Monitoring < ApplicationRecord
  belongs_to :master_monitoring
  belongs_to :infrastructure

  validates :infrastructure_id, uniqueness: {
    scope: [:master_monitoring_id],
  }
end
