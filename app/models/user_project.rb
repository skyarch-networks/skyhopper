#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class UserProject < ActiveRecord::Base
  belongs_to :project, dependent: :destroy
  belongs_to :user,    dependent: :destroy
end
