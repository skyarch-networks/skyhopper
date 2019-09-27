#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Client < ApplicationRecord
  has_many :projects, dependent: :restrict_with_exception
  has_many :infrastructures, through: :projects

  validates :code,
            uniqueness: true

  FOR_SYSTEM_CODE_NAME = 'SkyHopper'.freeze

  # @return [Client]
  def self.for_system
    find_by(code: FOR_SYSTEM_CODE_NAME)
  end

  # @return [Boolean]
  def for_system?
    code == FOR_SYSTEM_CODE_NAME
  end
end
