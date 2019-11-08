#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :resource, aliases: [:ec2_resource] do
    sequence(:physical_id) { |n| "i-123#{n}abc" }
    type_name 'AWS::EC2::Instance'
    screen_name 'EC2 Instance'
    infrastructure

    factory :rds_resource do
      type_name   'AWS::RDS::DBInstance'
      screen_name nil
    end

    factory :s3bucket_resource do
      type_name   'AWS::S3::Bucket'
      screen_name nil
    end
  end
end
