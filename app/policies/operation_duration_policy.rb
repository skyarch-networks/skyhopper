#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationDurationPolicy < ApplicationPolicy
  %i[create? upload_icalendar?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

  %i[show? show_icalendar?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end
end
