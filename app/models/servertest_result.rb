#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestResult < ActiveRecord::Base
  belongs_to :resource
  has_many :servertest_result_details
  has_many :servertests, through: :servertest_result_details
  enum status: %i[success pending failed error]
end
