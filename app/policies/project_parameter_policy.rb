#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectParameterPolicy < ApplicationPolicy
  # admin :update?, :destroy?, :new?,
  # def index?;true end
  #
  # %i[destroy? new? create?].each do |action|
  #   define_method(action) do
  #     user.master? and user.admin? and not record.client.is_for_system?
  #   end
  # end
end
