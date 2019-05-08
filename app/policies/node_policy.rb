#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# record is a Infrastructure.
class NodePolicy < ApplicationPolicy
  def show?
    user.allow?(record)
  end


  %i[apply_dish? submit_groups? create_group? get_rules? get_security_groups? yum_update? schedule_yum? run_ansible_playbook? edit_ansible_playbook? update_ansible_playbook?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end
end
