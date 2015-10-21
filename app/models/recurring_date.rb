class RecurringDate < ActiveRecord::Base
  belongs_to :operation_duration
  enum repeats: ['', :everyday, :weekdays, :weekends, :other]
  serialize :dates, JSON
end
