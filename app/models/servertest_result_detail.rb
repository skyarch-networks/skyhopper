#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestResultDetail < ApplicationRecord
  belongs_to :servertest
  belongs_to :servertest_result
end
