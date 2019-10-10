#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ClientPolicy < ApplicationPolicy
  master :index?, :show?, :create?, :new?

  %i[update? edit? destroy?].each do |action|
    define_method(action) do
      user.master? and !record.for_system?
    end
  end
end
