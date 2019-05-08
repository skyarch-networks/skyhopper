#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DishPolicy < ApplicationPolicy
  %i[show? index? ].each do |action|
    define_method(action) do
      return true unless record.project

      return user.allow?(record.project)
    end
  end


  %i[edit? update? new? create? destroy? validate?].each do |action|
    define_method(action) do
      if record.project
        user.allow?(record.project) and user.admin?
      else
        user.admin?
      end
    end
  end
end
