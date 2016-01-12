#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerStatusController < ApplicationController
  before_action :authenticate_user!
  before_action :set_server


  # POST /server/:kind/start
  # @param [String] kind Server kind. "chef" or "zabbix"
  def start
    @server.start

    render nothing: true
  end

  # POST /server/:kind/stop
  # @param [String] kind Server kind. "chef" or "zabbix"
  def stop
    @server.stop

    render nothing: true
  end

  # POST /server/:kind/status
  # @param [String] kind Server kind. "chef" or "zabbix"
  # @param [Boolean] background If this is true, server status updated background.
  def status
    unless params[:background] || @server.is_in_progress?
      render text: @server.status and return
    end

    render text: @server.latest_status and return
  end


  private

  def set_server
    @server = ServerState.new(params.require(:kind))
  end
end
