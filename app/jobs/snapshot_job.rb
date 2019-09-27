#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class SnapshotJob < ApplicationJob
  queue_as :default

  def perform(volume_id, physical_id, infra, user_id)
    @schedule = SnapshotSchedule.find_by(volume_id: volume_id)

    if @schedule.try(:enabled)
      self.class.set(
        wait_until: @schedule.next_run,
      ).perform_later(volume_id, physical_id, infra, user_id)
    end

    @ws = WSConnector.new('notifications', User.find(user_id).ws_key)

    create_snapshot(volume_id, physical_id, infra, user_id)

    DeleteOutdatedSnapshotsJob.perform_later(volume_id, infra)
  end

  def create_snapshot(volume_id, physical_id, infra, user_id)
    snapshot = Snapshot.create(infra, volume_id, physical_id)
    infra_log(infra.id, user_id, true, "Snapshot creation for #{volume_id} has started.\n Snapshot ID: #{snapshot.snapshot_id}")

    until snapshot.latest_status == 'completed'
      sleep(15)
    end

    infra_log(infra.id, user_id, true, "Snapshot creation for #{snapshot.volume_id} has completed.\n Snapshot ID: #{snapshot.snapshot_id}")
  rescue Snapshot::VolumeNotFoundError, Snapshot::VolumeRetiredError => ex
    @schedule.destroy
    infra_log(infra.id, user_id, false, "Snapshot creation for #{snapshot.volume_id} has failed.\n #{ex.class}: #{ex.message.inspect} \n" + ex.backtrace.join("\n"))
  end

  def infra_log(infra_id, user_id, status, details)
    log = InfrastructureLog.create(
      infrastructure_id: infra_id, user_id: user_id, status: status,
      details: details,
    )
    @ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
  end
end
