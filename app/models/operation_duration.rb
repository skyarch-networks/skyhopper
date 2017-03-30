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
  validates_uniqueness_of :resource_id

  def to_ics
    cal = Icalendar::Calendar.new
    cal.event do |e|
      e.dtstart       = self.start_date.strftime("%Y%m%dT%H%M%S")
      e.dtend         = self.end_date.strftime("%Y%m%dT%H%M%S")
      e.created       = self.created_at
      e.last_modified = self.updated_at
      e.ip_class      = "PRIVATE"
      e.rrule         = "FREQ=WEEKLY,BYDAY=#{self.rrule}"
    end

  end

  def rrule
    w  = "FREQ=WEEKLY,"
    case self.recurring_date.repeats
    when 1
      return "FREQ=DAILY"
    when 2
      return "#{w}BYDAY=MO,TU,WE,TH,FR"
    when 3
      return "#{w}BYDAY=SA,SU"
    else
      return "#{w}BYDAY=#{self.dates_selected}"
    end
  end

  def dates_selected
    dates = []
    date_names = ["","MO","TU","WE","TH","FR", "ST", "SU"]
    self.recurring_date.dates.each { |t|
      dates.push(date_names[t[1]["value"].to_i]) if t[1]["checked"].to_s.eql?("true")
    }
    return dates.reject(&:blank?).join(",")

  end


end
