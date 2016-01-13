#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectParameter < ActiveRecord::Base
  belongs_to :project
  validates :project_id, uniqueness: {scope: [:key]}
  validates :key, format: { with: /\A[a-zA-Z_][a-zA-Z0-9_]*\Z/ }
end
