#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructurePolicy < ApplicationPolicy

  %i[index? show? stack_events? show_rds? show_s3? show_elb?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end

  %i[new? edit? create? update? destroy? delete_stack? change_rds_scale?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

  %i[new? create?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record) and not record.project.client.is_for_system?
    end
  end
end
