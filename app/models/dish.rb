#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Dish < ActiveRecord::Base
  belongs_to :project
  has_many :resources
  has_many :dish_servertests
  has_many :servertests, through: :dish_servertests

  serialize :runlist

  STATUS = {
    success: 'SUCCESS',
    failure: 'FAILURE',
    creating: 'CREATING',
    bootstrapping: 'BOOTSTRAPPING',
    applying: 'APPLYING',
    serverspec: 'SERVERSPEC',
  }.recursive_freeze

  def update_status(symbol_status)
    self.status = STATUS[symbol_status]
    save!
  end

  def validating?
    case self.status
    when STATUS[:creating], STATUS[:bootstrapping], STATUS[:applying], STATUS[:serverspec]
      return true
    end

    return false
  end

  def self.valid_dishes(project_id = nil)
    where(project_id: [nil, project_id]).where(status: STATUS[:success])
  end
end
