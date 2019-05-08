#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

FactoryGirl.define do
  factory :infrastructure_log do
    infrastructure
    sequence(:status, &:even?)
    details '------ Sugoi Log ------'
    user
  end
end
