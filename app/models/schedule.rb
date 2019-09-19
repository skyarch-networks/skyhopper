#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Schedule < ApplicationRecord
  enum frequency:   %i[daily weekly intervals]
  enum day_of_week: %i[sunday monday tuesday wednesday thursday friday saturday]

  scope :essentials, -> { select(:enabled, :frequency, :day_of_week, :time) }

  validates :frequency, inclusion: { in: frequencies }, if: :enabled
  validates :time, numericality: { greater_than: 0 }, if: -> { enabled && frequency == 'intervals' }

  def next_run
    case frequency
    when 'weekly'
      ntime = Time.current.beginning_of_week(:sunday) + self.day_of_week_before_type_cast.days + time.hours
      ntime += 1.week if ntime.past?
    when 'daily'
      ntime = Time.current.beginning_of_day + time.hours
      ntime = ntime.tomorrow if ntime.past?
    when 'intervals'
      ntime = Time.current.beginning_of_hour + time.hours
    end
    ntime
  end
end
