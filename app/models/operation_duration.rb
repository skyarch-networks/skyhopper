class OperationDuration < ActiveRecord::Base
  belongs_to :resource
  belongs_to :user
  has_one :recurring_date
end
