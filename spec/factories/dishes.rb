#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :dish, class: 'Dish' do
    name "MyString"
    runlist 'foo,bar,hoge,fuga'
    project
    status 'SUCCESS'
  end
end
