#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerStateWorker < ApplicationJob
  def perform(*params)
    kinds =
      if params.empty?
        %w[zabbix]
      else
        [params.first]
      end

    return unless AppSetting.set?

    kinds.each do |kind|
      status = fetch_and_notify(kind)
      if %i[pending stopping].include?(status)
        self.class.set(wait: 8.seconds).perform_later(kind)
      end
    end
  end

  def fetch_and_notify(kind)
    server = ServerState.new(kind)
    status = server.latest_status
    ws = WSConnector.new('server_status', kind)
    ws.push(status)
    status
  end
end
