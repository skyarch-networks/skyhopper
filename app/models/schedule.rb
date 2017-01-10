#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'sidekiq/api'

class Schedule < ActiveRecord::Base
  enum frequency:   %i[daily weekly intervals]
  enum day_of_week: %i[sunday monday tuesday wednesday thursday friday saturday]

  scope :essentials, -> {select(:enabled, :frequency, :day_of_week, :time)}

  validates :frequency, inclusion: { in: frequencies }, if: :enabled
  validates :time, numericality: { greater_than: 0 }, if: -> { enabled && frequency == 'intervals' }

  def next_run
    case self.frequency
    when 'weekly'
      ntime = Time.current.beginning_of_week(:sunday) + self[:day_of_week].days + self.time.hours
      ntime = ntime + 1.week if ntime.past?
    when 'daily'
      ntime = Time.current.beginning_of_day + self.time.hours
      ntime = ntime.tomorrow if ntime.past?
    when 'intervals'
      ntime = Time.current.beginning_of_hour + self.time.hours
    end
    ntime
  end
end
