#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class EC2Instance < SimpleDelegator
  # instance_types を取得するAPIがなさそう?
  Types = AWS::InstanceTypes[:current] + AWS::InstanceTypes[:previous]

  class ChangeScaleError < StandardError; end
  class RegisterNotSuccessError < StandardError; end

  attr_reader :physical_id

  def initialize(infra, physical_id:)
    @infra = infra
    @physical_id = physical_id

    @instance = Aws::EC2::Instance.new(physical_id, client: infra.ec2)
    __setobj__(@instance)
  end

  # status が変化するのを待つ
  # ==== Args
  # [status] :running or :stopped
  def wait_status(status)
    loop do
      case s = self.status
      when status
        break
      when :pending, :stopping
        sleep 5
      else
        raise StandardError, "#{s} is not expected status."
      end
    end
  end

  def wait_status_check_ok
    loop do
      s = status_check_info
      if s[:instance_status] == 'ok' && s[:system_status] == 'ok'
        break
      end

      raise StandardError, 'status check failed' unless %w[ok initializing].include?(s[:instance_status]) && %w[ok initializing].include?(s[:system_status])

      sleep 5
    end
  end

  def status_check_info
    response = @infra.ec2.describe_instance_status(
      instance_ids: [physical_id],
    )
    raise 'acquisition of instance status failed' if response.instance_statuses.length != 1

    {
      instance_status: response.instance_statuses[0].instance_status.status,
      system_status: response.instance_statuses[0].system_status.status,
    }
  end

  def change_scale(type)
    unless EC2Instance::Types.include?(type)
      raise ChangeScaleError, "Invalid type name: #{type}"
    end

    return type if instance_type == type

    stop
    wait_until(delay: 10) do |instance|
      instance.state.name == 'stopped'
    end

    begin
      modify_attribute(attribute: 'instanceType', value: type)
    rescue Aws::EC2::Errors::ClientInvalidParameterValue => ex
      start
      raise ChangeScaleError, ex.message
    end

    wait_until(delay: 3) do |instance|
      instance.instance_type == type
    end
    start

    type
  end

  def summary
    reload
    {
      status: state.name,
      instance_type: instance_type,
      public_dns: public_dns_name,
      elastic_ip: elastic_ip,
      public_ip: public_ip_address,
      block_devices: block_device_mappings,
      root_device_name: root_device_name,
      platform: platform,
      availability_zone: placement.availability_zone,
      security_groups: security_groups,
      retention_policies: retention_policies,
    }
  end

  def describe_keypair
    reload
    key_name
  end

  # for compatibility
  def status
    reload
    state.name.to_sym
  end

  def elastic_ip
    resp = client.describe_addresses(filters: [{ name: 'instance-id', values: [instance_id] }])
    resp.addresses.first.public_ip unless resp.addresses.empty?
  end

  def tags_by_hash
    tags.map { |e| [e.key, e.value] }.to_h
  end

  def fqdn
    public_dns_name.presence ||
      elastic_ip.presence ||
      private_dns_name
  end

  def ip_addr
    elastic_ip.presence ||
      public_ip_address.presence ||
      private_ip_address
  end

  def register_in_known_hosts(tries: 1, sleep: 5)
    fqdn_memo = fqdn
    raise RegisterNotSuccessError, 'failed to get fqdn' if fqdn_memo.blank?

    private_ip_address_memo = private_ip_address
    raise RegisterNotSuccessError, 'failed to get private_ip_address' if private_ip_address_memo.blank?

    Retryable.retryable(tries: tries, on: RegisterNotSuccessError, sleep: sleep) do
      added = ::KnownHosts::scan_and_add_keys("#{fqdn_memo},#{private_ip_address_memo}")
      raise RegisterNotSuccessError, 'failed to add keys in known_hosts' unless added
    end
  end

  def registered_in_known_hosts?
    fqdn_memo = fqdn
    raise 'failed to get fqdn' if fqdn_memo.blank?

    ::KnownHosts::match_remote_key?(fqdn_memo)
  end

  def platform
    @instance.platform
  end

  def password(ec2key)
    @instance.decrypt_windows_password(ec2key.path_temp)
  end

  def attachable_volumes(availability_zone)
    client.describe_volumes(
      filters: [{
        name: 'availability-zone',
        values: [availability_zone],
      }],
    ) .volumes
          .select { |volume| volume.state == 'available' }
          .map do |volume|
      tags_hash = volume.tags.map { |h| [h.key, h.value] }.to_h
        volume.tags = tags_hash
        volume
    end
  end

  def attach_volume(volume_id, device_name)
    client.attach_volume(
      volume_id: volume_id,
      instance_id: @physical_id,
      device: device_name,
    )
  end

  def detach_volume(volume_id)
    client.detach_volume(volume_id: volume_id)
  end

  def retention_policies
    volume_ids = block_device_mappings.map { |e| e.ebs.volume_id }
    policies = RetentionPolicy.where(resource_id: volume_ids).map do |policy|
      [
        policy.resource_id,
        {
          enabled: true,
          max_amount: policy.max_amount,
        },
      ]
    end.to_h # e.g. #=> { 'vol-123456': { max_amount: 3 } }
    volume_ids.each do |id|
      policies[id] = { enabled: false } unless policies.include?(id)
    end
    policies
  end

  delegate :create_volume, to: :client

  # 現在のリージョンの Availability Zones を取得します。値は一定期間キャッシュされます。
  # @return [Hash{String => Array<Aws::EC2::Types::AvailabilityZone>}] Stateでグループ化したHash
  def availability_zones
    Rails.cache.fetch("az-#{client.config.region}", expires_in: 2.hours) do
      resp = client.describe_availability_zones
      resp.availability_zones.group_by(&:state)
    end
  end
end
