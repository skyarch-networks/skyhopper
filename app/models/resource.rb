#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Resource < ApplicationRecord
  belongs_to :infrastructure
  belongs_to :dish
  has_many :resource_servertests
  has_many :servertests, through: :resource_servertests
  has_many :status, dependent: :delete_all, class_name: 'ResourceStatus'
  has_many :servertest_results
  has_many :operation_durations

  has_one :servertest_schedule, dependent: :destroy, foreign_key: 'physical_id', primary_key: 'physical_id'

  validates :physical_id, uniqueness: true
  validates :playbook_roles, json: true, unless: proc { |a| a.playbook_roles.nil? }
  validate :verify_playbook_roles
  validates :extra_vars, json: true, unless: proc { |a| a.extra_vars.nil? }

  scope :ec2, -> { where(type_name: 'AWS::EC2::Instance') }
  scope :rds, -> { where(type_name: 'AWS::RDS::DBInstance') }
  scope :s3,  -> { where(type_name: 'AWS::S3::Bucket') }
  scope :elb,  -> { where(type_name: 'AWS::ElasticLoadBalancing::LoadBalancer') }

  after_create :initialize_statuses

  class NotRegisterInKnownHosts < StandardError; end

  # 自身の持つ Serverpsec と、自身が持つ Dish に紐づく Serverspec の和集合を返す。
  # @XXX ActiveRecord::Relation を返したい。だけど arel の union が relation を返してくれなくてうまくいかない。
  # @return [Array<Serverspec>]
  def all_servertests
    servertests | (dish.try(:servertests) || [])
  end

  # XXX: パフォーマンスがきになる. all_serverspecs のほうが relation を返せば pluck が使える
  def all_servertest_ids
    all_servertests.map(&:id)
  end

  def initialize_statuses
    ResourceStatus.kinds.map do |_, k|
      ResourceStatus.create(
        resource: self,
        kind: k,
        content: 'un_executed',
      )
    end
  end

  def detach_zabbix
    z = ZabbixServer.find(infrastructure.project.zabbix_server_id)

    begin
      z = Zabbix.new(z.fqdn, z.username, z.password)
      z.delete_hosts_by_resource(physical_id)
    rescue StandardError => ex
      return self if ex.message.include('physical id not found.')

      raise ex
    end
  end

  def get_playbook_roles
    if playbook_roles.nil?
      return []
    end

    JSON.parse(playbook_roles)
  end

  def set_playbook_roles(playbook_roles)
    self.playbook_roles = playbook_roles.to_json
  end

  def get_extra_vars
    if extra_vars.nil?
      return '{}'
    end

    extra_vars
  end

  def should_be_registered_in_known_hosts(msg)
    raise NotRegisterInKnownHosts, msg unless register_in_known_hosts?
  end

  private

  def verify_playbook_roles
    errors.add(:playbook_roles, 'structure is incorrect') unless Ansible::verify_roles(get_playbook_roles)
  end
end
