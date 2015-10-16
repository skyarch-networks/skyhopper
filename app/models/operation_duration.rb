class OperationDuration < ActiveRecord::Base
  belongs_to :resource
  has_many :recurring_dates
end
