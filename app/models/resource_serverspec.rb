#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ResourceServerspec < ActiveRecord::Base
  belongs_to :resource,   dependent: :destroy
  belongs_to :serverspec, dependent: :destroy
end
