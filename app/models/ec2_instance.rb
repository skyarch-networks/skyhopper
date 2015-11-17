#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class EC2Instance < SimpleDelegator
  # instance_types を取得するAPIがなさそう?
  Types = AWS::InstanceTypes[:current] + AWS::InstanceTypes[:previous]

  class ChangeScaleError < StandardError; end

  attr_reader :physical_id

  def initialize(infra, physical_id:)
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
    return {
      status:        state.name,
      instance_type: instance_type,
      public_dns:    public_dns_name,
      elastic_ip:    elastic_ip,
      public_ip:     public_ip_address,
      block_devices: block_device_mappings,
      root_device_name: root_device_name,
      availability_zone: placement.availability_zone,
      security_groups: security_groups,
    }
  end

  def describe_keypair
    reload
    return key_name
  end

  # for compatibility
  def status
    reload
    state.name.to_sym
  end

  def elastic_ip
    resp = client.describe_addresses(filters: [{name: 'instance-id', values: [instance_id]}])
    resp.addresses.first.public_ip unless resp.addresses.empty?
  end

  def tags_by_hash
    tags.map { |e| [e.key, e.value] }.to_h
  end

  def fqdn
    return self.public_dns_name.presence ||
           self.elastic_ip.presence ||
           self.private_dns_name
  end

  def ip_addr
    return self.elastic_ip.presence ||
           self.public_ip_address.presence ||
           self.private_ip_address
  end

  def attachable_volumes(availability_zone)
    client.describe_volumes(
      filters: [{
        name: "availability-zone",
        values: [availability_zone],
      }])
      .volumes
      .select { |volume| volume.state == 'available' }
      .map { |volume|
        tags_hash = volume.tags.map { |h| [h.key, h.value] }.to_h
        volume.tags = tags_hash
        volume
      }
  end

  def attach_volume(volume_id, device_name)
    client.attach_volume(
      volume_id: volume_id,
      instance_id: @physical_id,
      device: device_name,
    )
  end
end
