#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# record is a Infrastructure.
class MonitoringPolicy < ApplicationPolicy
  %i[edit? update? create_host? edit_templates?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

  %i[show? show_cloudwatch_graph? show_zabbix_graph? show_problems? show_url_status?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end
end
