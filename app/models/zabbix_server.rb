class ZabbixServer < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  validates :fqdn, uniqueness: true

  extend Concerns::Cryptize
  cryptize :password
end
