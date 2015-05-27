#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecSchedule < ActiveRecord::Base
  belongs_to :resource, foreign_key: 'physical_id', primary_key: 'physical_id'

  enum frequency:   %i[daily weekly]
  enum day_of_week: %i[sunday monday tuesday wednesday thursday friday saturday]

  def next_run
    case self.frequency
    when 'weekly'
      tmp = Time.current.beginning_of_week(:sunday) + self[:day_of_week].days + self.time.hours
      tmp = tmp + 1.week if tmp.past?
    when 'daily'
      tmp = Time.current.beginning_of_day + self.time.hours
      tmp = tmp.tomorrow if tmp.past?
    end
    tmp
  end
end
