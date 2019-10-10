#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class SnapshotSchedule < Schedule
  before_update :delete_enqueued_jobs
  after_destroy :delete_enqueued_jobs

  JOB_CLASS_NAME = SnapshotJob.to_s.freeze

  def delete_enqueued_jobs
    jobs = Sidekiq::ScheduledSet.new.select do |job|
      args = job.args[0]
      args['job_class'] == JOB_CLASS_NAME && args['arguments'][0] == volume_id
    end
    jobs.each(&:delete)
  end
end
