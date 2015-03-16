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
end
