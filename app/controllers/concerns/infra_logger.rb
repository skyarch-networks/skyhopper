#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module Concerns::InfraLogger
  private

  def infra_logger_success(details, user_id: nil, infrastructure_id: nil)
    user_id, infrastructure_id = _set_args(user_id: user_id, infrastructure_id: infrastructure_id)
    ws_send(details, true)
    InfrastructureLog.success(
      infrastructure_id: infrastructure_id,
      details: details,
      user_id: user_id,
    )
  end

  def infra_logger_fail(details, user_id: nil, infrastructure_id: nil)
    user_id, infrastructure_id = _set_args(user_id: user_id, infrastructure_id: infrastructure_id)
    ws_send(details, false)
    InfrastructureLog.fail(
      infrastructure_id: infrastructure_id,
      details: details,
      user_id: user_id,
    )
  end

  def _set_args(user_id: nil, infrastructure_id: nil)
    user_id ||= current_user.id

    begin
      infrastructure_id ||= params[:infra_id] || params[:infrastructure_id] || params[:id] || @infrastructure.id
    rescue NoMethodError
      raise ArgumentError
    end
    raise ArgumentError unless infrastructure_id

    [user_id, infrastructure_id]
  end

  # ------- メソッド固有のもの

  def ws_send(details, status)
    ws = WSConnector.new('notifications', current_user.ws_key)
    ws.push_as_json({ message: details.truncate(100), status: status, timestamp: Time.zone.now.to_s })
  end
end
