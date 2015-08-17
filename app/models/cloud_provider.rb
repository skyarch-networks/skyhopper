#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class CloudProvider < ActiveRecord::Base
  has_many :projects
  validates :name, uniqueness: true

  class << self
    def aws
      self.find_by!(name: 'AWS')
    end
  end
end
