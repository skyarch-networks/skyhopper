
class ServerStateWorker
  def perform
    %w[chef zabbix].each do |kind|
      server = ServerState.new(kind)
      status = server.latest_status
      ws = WSConnector.new('server_status', kind)
      ws.push(status)
    end
  end
end
