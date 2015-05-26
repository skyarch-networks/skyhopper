# record is a Infrastructure.
class MonitoringPolicy < ApplicationPolicy
  %i[edit? update? create_host?].each do |action|
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
