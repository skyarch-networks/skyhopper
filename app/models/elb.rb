#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ELB
  def initialize(infra, elb_name)
    access_key_id = infra.access_key
    secret_access_key = infra.secret_access_key
    region = infra.region

    @name = elb_name

    @elb = ::Aws::ElasticLoadBalancing::Client.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region,
    )
  end

  # return instance description.
  # @return [Array<Hash{Symbol => String}>]
  def instances
    data = @elb.describe_instance_health(load_balancer_name: @name)
    return data.instance_states.map(&:to_hash)
  end

  # @return [Array<Hash{Symbol => String}>]
  def listeners
    return details.listener_descriptions.map(&:listener).map(&:to_hash)
  end

  # @return [String]
  def dns_name
    return details.dns_name
  end

  # register EC2 instance to ELB
  # @param [String] physical_id ID of EC2 instance.
  def register(physical_id)
    @elb.register_instances_with_load_balancer(
      load_balancer_name: @name,
      instances: [{instance_id: physical_id}],
    )
  end

  # deregister EC2 instance from ELB
  # @param [String] physical_id ID of EC2 instance.
  def deregister(physical_id)
    @elb.deregister_instances_from_load_balancer(
      load_balancer_name: @name,
      instances:[{instance_id: physical_id}],
    )
  end


  private


  # @return [Struct]
  def details
    data = @elb.describe_load_balancers(load_balancer_names: [@name])
    return data.load_balancer_descriptions.first
  end
end
