#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class SnapshotPolicy < ApplicationPolicy
  def index?
    user.allow?(record)
  end

  %i[create? destroy? schedule?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

end
