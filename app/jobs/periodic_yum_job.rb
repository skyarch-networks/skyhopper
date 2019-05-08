#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class PeriodicYumJob < ActiveJob::Base
  queue_as :default

  def perform(physical_id, infra, user_id)
    schedule = YumSchedule.find_by(physical_id: physical_id)

    PeriodicYumJob.set(
      wait_until: schedule.next_run,
    ).perform_later(physical_id, infra, user_id)

    status = schedule.resource.infrastructure.instance(physical_id).status
    if status == :running
      YumJob.perform_now(physical_id, infra, user_id)
    end
  end
end
