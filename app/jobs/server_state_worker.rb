
class ServerStateWorker < ActiveJob::Base
  def perform(*params)
    kinds =
      if params.size == 0
        %w[chef zabbix]
      else
        [params.first]
      end

    kinds.each do |kind|
      status = fetch_and_notify(kind)
      if status == :pending || status == :stopping
        self.class.set(wait: 8.seconds).perform_later(kind)
      end
    end
  end

  def fetch_and_notify(kind)
    server = ServerState.new(kind)
    status = server.latest_status
    ws = WSConnector.new('server_status', kind)
    ws.push(status)
    return status
  end
end
