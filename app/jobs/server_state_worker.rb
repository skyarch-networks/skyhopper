
class ServerStateWorker
  def perform
    %w[chef zabbix].each do |kind|
      server = ServerState.new(kind)
      server.notify_latest_status
    end
  end
end
