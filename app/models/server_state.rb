#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerState
  class NotRunning < StandardError; end
  class InfrastructureNotFound < StandardError
    def status_code
      404
    end
  end

  def initialize(kind)
    case kind
    when 'zabbix'
      infra = Project.for_zabbix_server.infrastructures.last
    else
      raise ArgumentError, "#{kind} is invalid as ServerStatus kind"
    end
    raise InfrastructureNotFound if infra.nil?

    resources = infra.resources_or_create
    physical_id = resources.first.physical_id
    @server = infra.instance(physical_id)
    @kind = kind
  end

  attr_reader :kind

  def status
    Rails.cache.fetch("serverstate-#{@kind}") { @server.status }
  end

  def latest_status
    s = @server.status
    Rails.cache.write("serverstate-#{@kind}", s)
    s
  end

  def start
    @server.start
  end

  def stop
    @server.stop
  end

  def running?
    status.to_s == 'running'
  end

  def in_progress?
    status.to_s == 'pending' || status.to_s == 'stopping'
  end

  # @param [String] msg is an Error message.
  # @raise [NotRunning]
  def should_be_running!(msg)
    raise NotRunning, msg unless running?
  end
end
