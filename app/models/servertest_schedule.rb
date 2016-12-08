#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestSchedule < Schedule
  belongs_to :resource, foreign_key: 'physical_id', primary_key: 'physical_id'

  before_update :delete_enqueued_jobs
  after_destroy :delete_enqueued_jobs

  JOB_CLASS_NAME = PeriodicServerspecJob.to_s.freeze

  def delete_enqueued_jobs
    jobs = Sidekiq::ScheduledSet.new.select { |job|
      args = job.args[0]
      args['job_class'] == JOB_CLASS_NAME && args['arguments'][0] == self.physical_id
    }
    jobs.each(&:delete)
  end
end
