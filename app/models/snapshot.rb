require 'delegate'

class Snapshot < SimpleDelegator

  class << self
    def create(infra, volume_id, physical_id)
      ec2 = infra.ec2

      resp = ec2.create_snapshot(volume_id: volume_id)
      ec2.create_tags({resources: [resp.snapshot_id], tags: [{key: 'instance-id', value: physical_id}]})

      new(infra, resp.snapshot_id)
    end
  end

  # ==== Args
  # [infra] {Infrastructure}
  # [snapshot_id] {String}
  # ==== return
  # {Snapshot}
  def initialize(infra, snapshot_id)
    snapshot = Aws::EC2::Snapshot.new(snapshot_id, client: infra.ec2)
    __setobj__(snapshot)
  end

  def create_volume
    # orig_volume = client.describe_volumes(volume_ids: [volume_id]).volumes.first
    client.create_volume(availability_zone: az, snapshot_id: snapshot_id)
  end

end
