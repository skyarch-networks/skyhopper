#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecPolicy < ApplicationPolicy
  %i[index? show?].each do |action|
    define_method(action) do
      if record.infrastructure
        user.allow?(record.infrastructure)
      else
        true
      end
    end
  end

  %i[new? update? create? edit? destroy? select? results? run? create_for_rds? schedule?].each do |action|
    define_method(action) do
      if record.infrastructure
        user.allow?(record.infrastructure) && user.admin?
      else
        user.master? and user.admin?
      end
    end
  end
end
