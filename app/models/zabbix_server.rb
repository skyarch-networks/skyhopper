class ZabbixServer < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  validates :fqdn, uniqueness: true, zabbix_server_fqdn: true

  has_many :user_zabbix_servers
  has_many :users, through: :user_zabbix_servers

  extend Concerns::Cryptize
  cryptize :password
end
