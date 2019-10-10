#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructurePolicy < ApplicationPolicy
  %i[index? show? stack_events? get_schedule? show_rds? show_s3? show_elb?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end

  %i[edit? update? destroy? delete_stack? change_rds_scale? save_schedule? rds_submit_groups? start_rds? stop_rds? reboot_rds? edit_keypair? update_keypair?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

  %i[new? create?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record) and !record.client.for_system?
    end
  end
end
