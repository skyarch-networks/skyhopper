#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecResult < ActiveRecord::Base
  belongs_to :resource
  has_many :serverspec_result_details
  has_many :serverspecs, through: :serverspec_result_details
  enum status: [:success, :pending, :failed]
end
