#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class PeriodicSnapshotJob < ActiveJob::Base
  queue_as :default

  def perform(volume_id, physical_id, infra, user_id)
    schedule = SnapshotSchedule.find_by(volume_id: volume_id)

    PeriodicSnapshotJob.set(
      wait_until: schedule.next_run
    ).perform_later(volume_id, physical_id, infra, user_id)

    Snapshot.create(infra, volume_id, physical_id)
  end
end
