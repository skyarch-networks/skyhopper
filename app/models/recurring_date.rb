class RecurringDate < ActiveRecord::Base
  belongs_to :operation_duration
  serialize :dates, JSON
end
