class ZabbixServer < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_exception
  

end
