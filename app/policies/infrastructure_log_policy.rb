#
# Copyright (c) 2013-2018 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructureLogPolicy < ApplicationPolicy

  %i[index? download_all? download?].each do |action|
    define_method(action) do
      user.allow?(record.infrastructure) ? true : false
    end
  end
end
