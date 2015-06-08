#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :serverspec_schedule do
    sequence(:physical_id) { |n| "i-123#{n}abc" }
    enabled     true
    frequency   'weekly'
    day_of_week ServerspecSchedule::day_of_weeks.keys.sample
    time        { rand(0..23) }
    resource
  end
end
