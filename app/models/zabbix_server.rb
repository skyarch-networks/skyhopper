class ZabbixServer < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  validates :fqdn, uniqueness: true

  has_many :user_zabbix_servers
  has_many :users, through: :user_zabbix_servers

  extend Concerns::Cryptize
  cryptize :password
end
