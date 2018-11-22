#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Project < ActiveRecord::Base
  belongs_to :client
  belongs_to :cloud_provider
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

  ForDishTestCodeName  = 'DishTest'.freeze
  ChefServerCodeName   = 'ChefServer'.freeze
  ZabbixServerCodeName = 'ZabbixServer'.freeze


  def self.for_test
    return Client.for_system.projects.find_by(code: ForDishTestCodeName)
  end

  def self.for_chef_server
    return Client.for_system.projects.find_by(code: ChefServerCodeName)
  end

  def self.for_zabbix_server
    return Client.for_system.projects.find_by(code: ZabbixServerCodeName)
  end

  def self.for_system
    return Client.for_system.projects
  end

  def detach_zabbix
    s = ZabbixServer.find(self.zabbix_server_id)
    # delete associated host and user group from Zabbix
    z = Zabbix.new(s.fqdn, s.username, s.password)
    z.delete_hostgroup(self.code)
    z.delete_usergroup(self.code + '-read')
    z.delete_usergroup(self.code + '-read-write')
    return self
  end

  def register_hosts(zabbix, user)
    if zabbix.nil?
      return
    end
    z = Zabbix.new(zabbix.fqdn, zabbix.username, zabbix.password)
    # add new hostgroup on zabbix with project code as its name
    if z.get_hostgroup_ids(self.code).empty?
      hostgroup_id = z.add_hostgroup(self.code)
      z.create_usergroup(self.code + '-read',       hostgroup_id, Zabbix::PermissionRead)
      z.create_usergroup(self.code + '-read-write', hostgroup_id, Zabbix::PermissionReadWrite)

      hostgroup_names = Project.pluck(:code)
      hostgroup_ids = z.get_hostgroup_ids(hostgroup_names)
      z.change_mastergroup_rights(hostgroup_ids)
    end

    # Register current user from zabbix
    z.create_user(user) unless z.user_exists?(user.email)
  end

  def change_zabbix(zabbix_id, user)
    zabbix = ZabbixServer.find(zabbix_id)
    self.register_hosts(zabbix, user)
    self.zabbix_server_id = zabbix_id
    self.save!
  end
end
