#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ResourceStatus < ActiveRecord::Base
  belongs_to :resource

  enum value:  %i(success failed pending un_executed inprogress)
  enum kind:   %i(serverspec cook yum)

  kinds.each do |k, v|
    scope k, -> { find_by(kind: v) }
  end
end
