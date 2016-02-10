class RetentionPolicy < ActiveRecord::Base
  validates :resource_id, uniqueness: true
end
