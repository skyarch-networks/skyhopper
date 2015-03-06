#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

FactoryGirl.define do
  factory :master_monitoring, class: 'MasterMonitoring' do
    name {SecureRandom.base64(10)}
    item {SecureRandom.base64(10)}
    trigger_expression {SecureRandom.base64(10)}
    is_common {rand(10)%2==0} # true or false
  end
end
