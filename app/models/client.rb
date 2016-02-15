#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Client < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  has_many :infrastructures, through: :projects

  validates :code,
    uniqueness: true

  ForSystemCodeName = 'SkyHopper'.freeze

  # @return [Client]
  def self.for_system
    find_by(code: ForSystemCodeName)
  end

  # @return [Boolean]
  def is_for_system?
    self.code == ForSystemCodeName
  end
end
