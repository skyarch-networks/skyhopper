#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class CfTemplatePolicy < ApplicationPolicy
  %i[edit? update? destroy?].each do |action|
    define_method(action) do
      if record.infrastructure_id
        user.allow?(record.infrastructure)
      else
        user.master and user.admin
      end
    end
  end

  %i[history? show? index?].each do |action|
    define_method(action) do
      if record.infrastructure_id
        user.allow?(record.infrastructure)
      else
        true
      end
    end
  end

  %i[new_for_creating_stack? insert_cf_params? create_and_send?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record.infrastructure)
    end
  end

  master_admin :new?, :create?
end
