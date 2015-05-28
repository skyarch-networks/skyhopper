#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class EC2Instance
  class ChangeScaleError < StandardError; end

  def initialize(arg, physical_id: nil)
    raise ArgumentError unless physical_id

    @physical_id = physical_id

    case arg
    when Infrastructure
      @ec2 = arg.ec2
    else
      raise ArgumentError, "Invalid Argument: #{arg.inspect}"
    end

    @instance = @ec2.instances[physical_id]
  end
  attr_reader :physical_id

  %w[
    instance_type
    status
    start
    stop
    reboot
    tags
    dns_name
    public_ip_address
    elastic_ip
  ].each do |name|
    define_method(name) do
      @instance.__send__(name)
    end
  end

  def instance_type=(type)
    @instance.instance_type = type
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
    until status == :stopped
      sleep 10
    end

    begin
      self.instance_type = type
    rescue AWS::EC2::Errors::InvalidInstanceAttributeValue => ex
      start
      raise ChangeScaleError, ex.message
    end

    until instance_type == type
      sleep 3
    end
    start

    type
  end

  def summary
    c = @instance.client
    res = c.describe_instances(instance_ids: [physical_id]).reservation_set.first[:instances_set].first

    return {
      status:        res.instance_state.name,
      instance_type: res.instance_type,
      public_dns:    res.dns_name,
      elastic_ip:    elastic_ip,
      public_ip:     res.ip_address,
    }
  end
end
