#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Ec2InstancePolicy < ApplicationPolicy
  %i[change_scale? start? stop? reboot? available_resources? detach? terminate? serverspec_status? register_to_elb? deregister_from_elb? attachable_volumes? attach_volume?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end
end
