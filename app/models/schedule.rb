#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'sidekiq/api'

class Schedule < ActiveRecord::Base
  enum frequency:   %i[daily weekly intervals]
  enum day_of_week: %i[sunday monday tuesday wednesday thursday friday saturday]

  validates :frequency, inclusion: { in: frequencies }, if: :enabled
  validates :time, numericality: { greater_than: 0 }, if: -> { enabled && frequency == 'intervals' }

  before_update :delete_enqueued_jobs
  after_destroy :delete_enqueued_jobs

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

  def delete_enqueued_jobs
    jobs = Sidekiq::ScheduledSet.new.select { |job|
      args = job.args[0]
      args['job_class'] == job_class_name && args['arguments'][0] == self.physical_id
    }
    jobs.each(&:delete)
  end

  private

  def job_class_name
  end
end
