#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectParameter < ActiveRecord::Base
  belongs_to :project
  validates :project_id, uniqueness: {scope: [:key]}
  validates :key, format: { with: /\A[a-zA-Z_][a-zA-Z0-9_]*\Z/ }

  class << self
    # @param [String] target
    # @param [Project] project
    # @param [Integer] project_id
    # @return [String]
    def exec(target, project: nil, project_id: nil)
      raise ArgumentError if !(project_id || project)

      params = self.where(project_id: project_id || project.id)
      re = /(?<!\\)\$\{(?<key>#{params.map(&:key).join('|')})\}/
      target.gsub(re) do
        key = $~[:key]
        params.find_by(key: key).value
      end
    end
  end
end
