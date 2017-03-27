#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationDuration < ActiveRecord::Base
  belongs_to :resource
  belongs_to :user
  has_one :recurring_date

  validates :resource_id, presence: true

  def to_ics
    cal = Icalendar::Calendar.new
    cal.event do |e|
      e.dtstart       = self.start_date.strftime("%Y%m%dT%H%M%S")
      e.dtend         = self.end_date.strftime("%Y%m%dT%H%M%S")
      e.created       = self.created_at
      e.last_modified = self.updated_at
      e.ip_class      = "PRIVATE"
      e.summary       = "#{self.recurring_date.repeats}//#{self.recurring_date.dates}"
      e.rrule         = "FREQ=WEEKLY,#{self.reccurence}"
    end

  end

  def reccurence
    case self.recurring_date.repeats
    when "everyday"
      return "BYDAY=MO,TU,WE,TH,FR"
    when "weekends"
      return "BYDAY=SA,SU"
    else
      return nil
    end
  end

  def dates_selected
    self.recurring_date.dates.each { |t|
      t.puts
    }
  end



end
