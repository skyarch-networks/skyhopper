class OperationDuration < ActiveRecord::Base
  belongs_to :resource
  has_one :recurring_date
end
