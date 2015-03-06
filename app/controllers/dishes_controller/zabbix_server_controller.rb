#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ZabbixServerController < ApplicationController
  # TODO: 必要な権限は何?
  include Concerns::BeforeAuth

  before_action :authenticate_user!


  # POST /zabbix_server/start
  def start
    zabbix_server = ZabbixServer::Status.new
    zabbix_server.start

    render text: I18n.t('zabbix_server.msg.start')
  end

  # POST /zabbix_server/stop
  def stop
    zabbix_server = ZabbixServer::Status.new
    zabbix_server.stop

    render text: I18n.t('zabbix_server.msg.stop')
  end

  # POST /zabbix_server/status
  def status
    zabbix_server = ZabbixServer::Status.new

    if params[:background] || zabbix_server.is_in_progress?
      Thread.new do
        ws = WSConnector.new('zabbix_server', 'status')    # ws://HOST/zabbix_server/status

        before_status = ""
        10.times do |i|
          status = zabbix_server.latest_status
          ws.push(status)
          break if status == "running" && before_status == "pending"
          break if status == "stopped" && before_status == "stopping"
          before_status = status
          sleep(8)
        end
        ws.push("finish_ws")
      end
    end

    render text: zabbix_server.status and return
  end
end
