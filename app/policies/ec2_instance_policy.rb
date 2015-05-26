class Ec2InstancePolicy < ApplicationPolicy
  %i[change_scale? start? stop? reboot? serverspec_status? register_to_elb? deregister_from_elb?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end
end
