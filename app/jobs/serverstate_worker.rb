
class ServerStateWorker
  def perform
    %w[chef zabbix].each do |kind|
      infra = Project.__send__("for_#{kind}_server").infrastructures.last
      resources = infra.resources_or_create
      physical_id = resources.first.physical_id
      server = infra.instance(physical_id)
      Rails.cache.write("serverstate-#{kind}", server.status)
    end
  end
end
