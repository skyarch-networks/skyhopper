#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class YumJob < ActiveJob::Base
  queue_as :default

  def perform(physical_id, infra, user_id, cook = false, security = true, exec = false)
    ws = WSConnector.new('notifications', User.find(user_id).ws_key)
    ws_cook = WSConnector.new('cooks', physical_id) if cook

    yum_screen_name = 'yum'
    yum_screen_name << ' check' unless exec
    yum_screen_name << ' security' if security
    yum_screen_name << ' update'
    ws.push_as_json({ message: "#{yum_screen_name} for #{physical_id} is started.", status: true, timestamp: Time.zone.now.to_s })

    node = Node.new(physical_id)

    r = Resource.find_by(physical_id: physical_id)
    r.status.yum.inprogress!
    r.status.serverspec.un_executed! if exec

    log = []

    begin
      node.yum_update(infra, security, exec) do |line|
        if cook
          ws_cook.push_as_json({ v: line })
          Rails.logger.debug "#{yum_screen_name} #{physical_id} > #{line}"
        end
        log << line
      end
    rescue StandardError => ex
      Rails.logger.debug(ex) if cook
      log = InfrastructureLog.create(
        infrastructure_id: infra.id, user_id: user_id, status: false,
        details: "#{yum_screen_name} for #{physical_id} is failed.\nlog:\n#{log.join("\n")}",
      )
      ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
      ws_cook.push_as_json({ v: false }) if cook
      r.status.yum.failed!
    else
      log = InfrastructureLog.create(
        infrastructure_id: infra.id, user_id: user_id, status: true,
        details: "#{yum_screen_name} for #{physical_id} is successfully finished.\nlog:\n#{log.join("\n")}",
      )
      ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
      ws_cook.push_as_json({ v: true }) if cook
      r.status.yum.success!
    end
  end
end
