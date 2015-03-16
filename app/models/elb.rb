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
    return data.first.instance_states.map(&:to_hash)
  end
end
