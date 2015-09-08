#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

FactoryGirl.define do
  factory :serverspec_result do
    resource
    status :success
    message 'serverspec success'
  end

  sequence(:id) {|n| n }

  sequence(:code) {|n| "a10#{n}a1a1" }
  sequence(:name) {|n| "株式会社AAAA".tap {|str| n.times { str.replace(str.succ) } } }

  factory :client do
    code
    name
  end

  factory :project do
    code
    name "キャンペーンWebサイト"
    access_key "1234567890"
    secret_access_key "1234567890"
    client
    cloud_provider_id{CloudProvider.aws.id}
  end

  sequence(:status) do |n|
    case n % 3
    when 0
      "CREATE_COMPLETE"
    when 1
      "CREATE_FAILED"
    when 2
      "DELETE_COMPLEETE"
    end
  end

  sequence(:stack_name){|n|"test-stack#{n}"}

  factory :infrastructure do
    region "region"
    status
    stack_name
    created_at "2013-07-18 07:38:01"
    updated_at "2013-07-18 08:12:50"
    project
    ec2_private_key
  end

  sequence :email do |n|
    "test#{n}@example.com"
  end

  factory :user do
    email
    password "password"
    admin true
    master true
  end

  factory :serverspec do
    infrastructure
    name 'hoge'
    value 'fuga'
    description 'piyo'
  end
end
