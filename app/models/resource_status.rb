#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ResourceStatus < ApplicationRecord
  belongs_to :resource

  enum content: %i[success failed pending un_executed inprogress]
  enum kind: %i[servertest cook yum ansible]

  kinds.each do |k, v|
    scope k, -> { find_by(kind: v) }
  end
end
