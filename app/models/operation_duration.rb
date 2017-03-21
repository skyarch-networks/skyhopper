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

  def to_ics
    cal = Icalendar::Calendar.new
    cal.event do |e|
      e.dtstart       = self.start_date.strftime("%Y%m%dT%H%M%S")
      e.dtend         = self.end_date.strftime("%Y%m%dT%H%M%S")
      e.created       = self.created_at
      e.last_modified = self.updated_at
      e.ip_class      = "PRIVATE"
    end
  end



end
