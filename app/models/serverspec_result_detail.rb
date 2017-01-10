#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecResultDetail < ActiveRecord::Base
  belongs_to :serverspec
  belongs_to :serverspec_result
end
