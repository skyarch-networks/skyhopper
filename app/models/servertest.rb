#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'fileutils'

class Servertest < ActiveRecord::Base
  belongs_to :infrastructure

  has_many :dish_servertests
  has_many :dishes, through: :dish_servertests
  has_many :resource_servertests
  has_many :resources, through: :resource_servertests
  has_many :servertest_results, through: :servertest_result_details
  enum      category: %i[awspec serverspec]

  validates :value, ruby: true

  TmpDir = Rails.root.join('tmp', 'serverspec')
  FileUtils::mkdir_p(TmpDir) unless Dir::exist?(TmpDir)

  %i[name value].each do |sym|
    validates sym, presence: true
  end

  class << self
    def for_infra(infrastructure_id)
      where(infrastructure_id: [nil, infrastructure_id]).to_a
    end

    def for_infra_serverspec(infrastructure_id)
      where(infrastructure_id: [nil, infrastructure_id], category: 1).to_a
    end

    def global
      where(infrastructure_id: nil)
    end

    def to_file(id)
      require 'tempfile'
      result = Tempfile.new(id.to_s, TmpDir)
      result.write(find_by(id: id).value)
      result.flush
      result.path
    end

    def create_rds(rds, user, passwd, infra_id, db_name = nil)
      require 'erb'

      db_engine = rds.engine_type
      db_engine = 'psql' if db_engine == 'postgres'
      host      = rds.endpoint_address

      spec_template = File::open(Rails.root.join('serverspec', 'rdsspec.rb.erb')).read

      spec_value = ERB.new(spec_template).result(binding)

      description = "Check connection to RDS host:#{host[/^([^\.]+)\./, 1]} as user:#{user}"
      description << ", database:#{db_name}" if db_name

      create(
        infrastructure_id: infra_id,
        name: "RDS connection to #{host[/^([^\.]+)\./, 1]}",
        value: spec_value,
        description: description,
      )
    end
  end
end
