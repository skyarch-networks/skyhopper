class ZabbixServer < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  validates :fqdn, uniqueness: true, zabbix_server_fqdn: true

  has_many :user_zabbix_servers
  has_many :users, through: :user_zabbix_servers

  extend Concerns::Cryptize
  cryptize :password

  def self.selected_zabbix(zabbix_id)
    return self.all.map {|z|
      {
        id: z.id,
        fqdn: z.fqdn,
        version: z.version,
        details: z.details,
        created_at: z.created_at.strftime("%B %d, %Y at %l:%m %p %Z"),
        is_checked: (z.id == zabbix_id),
      }
    }
  end
end
