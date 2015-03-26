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

  scope :ec2, -> {where(type_name: 'AWS::EC2::Instance')}
  scope :rds, -> {where(type_name: 'AWS::RDS::DBInstance')}
  scope :s3,  -> {where(type_name: 'AWS::S3::Bucket')}
  scope :elb,  -> {where(type_name: 'AWS::ElasticLoadBalancing::LoadBalancer')}
end
