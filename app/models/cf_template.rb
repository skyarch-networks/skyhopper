#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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

  def self.for_infra(infrastructure_id)
    where(infrastructure_id: infrastructure_id).order('created_at DESC')
  end

  def self.global
    where(infrastructure_id: nil)
  end

  # create parameters set for cloudformation
  def create_cfparams_set(infrastructure, params_inserted = nil)
    parameters = if JSON::parse(self.value)['Parameters'].include?("KeyName")
      [{ parameter_key: "KeyName", parameter_value: infrastructure.keypairname }]
    else
      []
    end

    if params_inserted
      params_inserted.each do |key, val|
        parameters.push({ parameter_key: key, parameter_value: val })
      end
    end

    @params_not_json = parameters.compact
  end

  def validate_template
    s = Stack.new(Project.for_chef_server.infrastructures.first)
    s.validate_template(self.value)
  end

  def parsed_cfparams
    @params_not_json || JSON::parse(self.params)
  end

  def update_cfparams
    self.params = @params_not_json.to_json if @params_not_json
  end
end
