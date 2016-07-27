#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ZabbixServerPolicy < ApplicationPolicy
  # TODO: Project のインスタンスへの権限が与えられている場合はどうする?
  admin :edit?, :update?
  def index?;true end

  %i[destroy? new? create?].each do |action|
    define_method(action) do
      user.master? and user.admin?
    end
  end
end
