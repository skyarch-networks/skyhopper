#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Resource < ActiveRecord::Base
  belongs_to :infrastructure
  belongs_to :dish
  has_many :resource_serverspecs
  has_many :serverspecs, through: :resource_serverspecs
  has_many :status, dependent: :delete_all, class_name: 'ResourceStatus'
  has_many :serverspec_results
  has_many :operation_durations

  has_one :serverspec_schedule, dependent: :destroy, foreign_key: 'physical_id', primary_key: 'physical_id'

  validates :physical_id, uniqueness: true

  scope :ec2, -> {where(type_name: 'AWS::EC2::Instance')}
  scope :rds, -> {where(type_name: 'AWS::RDS::DBInstance')}
  scope :s3,  -> {where(type_name: 'AWS::S3::Bucket')}
  scope :elb,  -> {where(type_name: 'AWS::ElasticLoadBalancing::LoadBalancer')}

  after_create :initialize_statuses

  # 自身の持つ Serverpsec と、自身が持つ Dish に紐づく Serverspec の和集合を返す。
  # @XXX ActiveRecord::Relation を返したい。だけど arel の union が relation を返してくれなくてうまくいかない。
  # @return [Array<Serverspec>]
  def all_serverspecs
    self.serverspecs | (self.dish.try(:serverspecs) || [])
  end

  # XXX: パフォーマンスがきになる. all_serverspecs のほうが relation を返せば pluck が使える
  def all_serverspec_ids
    all_serverspecs.map{|x|x.id}
  end

  def initialize_statuses
    ResourceStatus.kinds.map{|_, k| ResourceStatus.create(
      resource: self,
      kind: k,
      value: 'un_executed',
    )}
  end
end
