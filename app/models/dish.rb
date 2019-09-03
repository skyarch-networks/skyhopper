#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
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

  validates :playbook_roles, json: true, unless: proc { |a| a.playbook_roles.nil? }
  validate :verify_playbook_roles
  validates :extra_vars, json: true, unless: proc { |a| a.extra_vars.nil? }

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
    case status
    when STATUS[:creating], STATUS[:bootstrapping], STATUS[:applying], STATUS[:serverspec]
      return true
    end

    false
  end

  def playbook_roles_safe
    return [] if playbook_roles.nil?
    JSON.parse(playbook_roles)
  end

  def extra_vars_safe
    return '{}' if extra_vars.nil?
    extra_vars
  end

  def self.valid_dishes(project_id = nil)
    where(project_id: [nil, project_id]).where(status: STATUS[:success])
  end

  private

  def verify_playbook_roles
    errors.add(:playbook_roles, 'structure is incorrect') unless Ansible::verify_roles(playbook_roles_safe)
  end
end
