#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Project < ApplicationRecord
  belongs_to :client
  belongs_to :zabbix_server

  has_many :infrastructures,    dependent: :restrict_with_exception
  has_many :dishes,             dependent: :delete_all
  has_many :project_parameters, dependent: :delete_all

  has_many :user_projects
  has_many :users, through: :user_projects

  validates :code, uniqueness: true, project_code: true

  before_destroy :detach_zabbix

  extend Concerns::Cryptize
  cryptize :access_key
  cryptize :secret_access_key

  FOR_DISH_TEST_CODE_NAME = 'DishTest'.freeze
  CHEF_SERVER_CODE_NAME   = 'ChefServer'.freeze
  ZABBIX_SERVER_CODE_NAME = 'ZabbixServer'.freeze

  def self.for_test
    Client.for_system.projects.find_by(code: FOR_DISH_TEST_CODE_NAME)
  end

  def self.for_zabbix_server
    Client.for_system.projects.find_by(code: ZABBIX_SERVER_CODE_NAME)
  end

  def self.for_system
    Client.for_system.projects
  end

  def detach_zabbix
    if zabbix_server_id.nil?
      return
    end

    s = ZabbixServer.find(zabbix_server_id)
    # delete associated host and user group from Zabbix
    z = Zabbix.new(s.fqdn, s.username, s.password)
    z.delete_hostgroup(code)
    z.delete_usergroup(code + '-read')
    z.delete_usergroup(code + '-read-write')
    self
  end

  def register_hosts(zabbix, user)
    if zabbix.nil?
      return
    end

    z = Zabbix.new(zabbix.fqdn, zabbix.username, zabbix.password)
    # add new hostgroup on zabbix with project code as its name
    if z.get_hostgroup_ids(code).empty?
      hostgroup_id = z.add_hostgroup(code)
      z.create_usergroup(code + '-read',       hostgroup_id, Zabbix::PERMISSION_READ)
      z.create_usergroup(code + '-read-write', hostgroup_id, Zabbix::PERMISSION_READ_WRITE)

      hostgroup_names = Project.pluck(:code)
      hostgroup_ids = z.get_hostgroup_ids(hostgroup_names)
      z.change_mastergroup_rights(hostgroup_ids)
    end

    # Register current user from zabbix
    z.create_user(user) unless z.user_exists?(user.email)
  end

  def change_zabbix(zabbix_id, user)
    zabbix = ZabbixServer.find(zabbix_id)
    register_hosts(zabbix, user)
    self.zabbix_server_id = zabbix_id
    save!
  end
end
