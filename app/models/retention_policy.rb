class RetentionPolicy < ApplicationRecord
  validates :resource_id, uniqueness: true
end
