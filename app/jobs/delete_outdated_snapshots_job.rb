#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DeleteOutdatedSnapshotsJob < ActiveJob::Base
  queue_as :default

  def perform(volume_id, infra)
    policy = RetentionPolicy.find_by(resource_id: volume_id)
    delete_outdated_snapshots(infra, volume_id, policy) if policy
  end

  def delete_outdated_snapshots(infra, volume_id, policy)
    snapshots = Snapshot.describe(infra, volume_id)
    snapshots.delete_if { |snapshot|
      snapshot.tags.key?(Snapshot::PROTECTION_TAG_NAME) &&
        snapshot.tags[Snapshot::PROTECTION_TAG_NAME] != 'false'
    }
    snapshots.sort_by! { |snapshot| snapshot.start_time }.reverse!
    outdated = snapshots[(policy.max_amount)..-1]
    return if outdated.nil?
    outdated.each do |snapshot|
      infra.ec2.delete_snapshot(snapshot_id: snapshot.snapshot_id)
    end
  end
end
