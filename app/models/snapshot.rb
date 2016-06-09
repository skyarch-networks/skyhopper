#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'delegate'

class Snapshot < SimpleDelegator
  PROTECTION_TAG_NAME = 'skyhopper_protect_this'.freeze

  class VolumeNotFoundError < StandardError; end
  class VolumeRetiredError < StandardError; end
  class VolumeProtectedError < StandardError; end

  class << self
    def create(infra, volume_id, physical_id)
      ec2 = infra.ec2

      begin
        resp = ec2.create_snapshot(volume_id: volume_id)
        ec2.create_tags({resources: [resp.snapshot_id], tags: [{key: 'instance-id', value: physical_id}]})
      rescue Aws::EC2::Errors::IncorrectState => e
        raise VolumeRetiredError, e.message if e.message =~ /retired/
      rescue Aws::EC2::Errors::InvalidVolumeNotFound => e
        raise VolumeNotFoundError, e.message
      end

      new(infra, resp.snapshot_id)
    end

    def describe(infra, volume_id)
      ec2 = infra.ec2

      parameters = { owner_ids: ['self'] }
      parameters[:filters] = [{name: 'volume-id', values: [volume_id]}] if volume_id && !volume_id.empty?
      resp = ec2.describe_snapshots(parameters)

      return resp.snapshots.map { |snapshot|
        tags_hash = snapshot.tags.map { |tag| [tag.key, tag.value] }.to_h
        snapshot.tags = tags_hash
        snapshot
      }
    end
  end

  # @param [Infrastructure] infra
  # @param [String] snapshot_id
  # @return [Snapshot]
  def initialize(infra, snapshot_id)
    snapshot = Aws::EC2::Snapshot.new(snapshot_id, client: infra.ec2)
    __setobj__(snapshot)
  end

  def create_volume
    # orig_volume = client.describe_volumes(volume_ids: [volume_id]).volumes.first
    client.create_volume(availability_zone: az, snapshot_id: snapshot_id)
  end

  def latest_status
    # owner_ids: ['self'] を指定しないと最新の state が降ってこないような気がする
    # パラメータによってレスポンスの state が異なることがある
    resp = client.describe_snapshots(
      owner_ids: ['self'],
      snapshot_ids: [snapshot_id],
      filters: [
        { name: 'volume-id', values: [volume_id] },
        { name: 'snapshot-id', values: [snapshot_id]},
      ]
    )

    resp.snapshots.first.state
  end

  def delete
    raise VolumeProtectedError if protected?
    __getobj__.delete
  end

  def protected?
    tags.any? { |tag|
      tag.key == PROTECTION_TAG_NAME && tag.value != 'false'
    }
  end

end
