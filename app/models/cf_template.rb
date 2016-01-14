#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# infrastructure_id が nil のものは、グローバルなテンプレート
# Historyとは別に選択できるようにする。
class CfTemplate < ActiveRecord::Base
  validates :id,
    uniqueness: true
  validates :value, json: true

  belongs_to :infrastructure
  belongs_to :user

  # @param [String|Integer] infra_id ID of Infrastructure
  # @return [Array<CfTemplate>]
  def self.for_infra(infra_id)
    where(infrastructure_id: infra_id).order('created_at DESC')
  end

  # @return [Array<CfTemplate>]
  def self.global
    where(infrastructure_id: nil)
  end

  # create parameters set for cloudformation
  def create_cfparams_set(infrastructure, params_inserted = {})
    parameters = []
    if JSON::parse(self.value)['Parameters'].try(:include?, "KeyName")
      parameters.push(
        parameter_key:   "KeyName",
        parameter_value: infrastructure.keypairname,
      )
    end

    params_inserted.each do |key, val|
      parameters.push(
        parameter_key: key,
        parameter_value: val
      )
    end

    @params_not_json = parameters.compact
  end

  # @raise [Aws::CloudFormation::Errors::ValidationError] when invalid as cf_template
  def validate_template
    s = Stack.new(Project.for_chef_server.infrastructures.first)
    s.validate_template(self.value)
  end

  # @return [Hash<String => String>]
  def parsed_cfparams
    @params_not_json || JSON::parse(self.params)
  end

  def update_cfparams
    self.params = @params_not_json.to_json if @params_not_json
  end
end
