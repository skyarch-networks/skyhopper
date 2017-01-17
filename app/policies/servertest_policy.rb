#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestPolicy < ApplicationPolicy
  %i[index? show?].each do |action|
    define_method(action) do
      if record.infrastructure
        user.allow?(record.infrastructure)
      else
        true
      end
    end
  end

  %i[new? update? create? edit? destroy? select? results? run_serverspec? create_for_rds? schedule? generator?].each do |action|
    define_method(action) do
      if record.infrastructure
        user.allow?(record.infrastructure) && user.admin?
      else
        user.master? and user.admin?
      end
    end
  end
end
