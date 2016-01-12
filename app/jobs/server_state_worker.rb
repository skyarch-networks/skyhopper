
class ServerStateWorker
  def perform
    %w[chef zabbix].each do |kind|
      server = ServerState.new(kind)
      status = server.latest_status
    end
  end
end
