#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectParameterPolicy < ApplicationPolicy
  def show?
    user.allow?(record)
  end

  def update?
    user.admin? && user.allow?(record)
  end
end
