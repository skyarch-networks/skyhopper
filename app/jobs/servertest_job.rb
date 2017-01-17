#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestJob < ActiveJob::Base
  queue_as :default

  # Serverspec を実行し、結果をインフラログに書き出す。
  # また、Resource の Serverspec IDs を更新する。
  # @param [String] physical_id ID of EC2 Instance
  # @param [Integer] infra_id
  # @param [Integer] user_id このユーザーで Serverspec が実行される
  # @param [Array<Integer>] servertest_ids 指定されていなければ、Resource に紐付いた Serverspec を実行する。
  #                                        指定されていれば、指定した Serverspec を実行する。
  # @param [Boolean] auto_generated
  def perform(physical_id, infra_id, user_id, servertest_ids: nil, auto_generated: false, category: nil)
    node = Node.new(physical_id)
    unless servertest_ids
      infra = Infrastructure.find(infra_id)
      resource = infra.resource(physical_id)
      servertest_ids = resource.all_servertest_ids
    end

    @ws = WSConnector.new('notifications', User.find(user_id).ws_key)

    infra_logger_serverspec_start(physical_id, infra_id, user_id, auto_generated, servertest_ids)
    begin
      resp = if category.nil?
        node.run_serverspec(infra_id, servertest_ids, auto_generated)
      else
        node.run_awsspec(infra_id, servertest_ids, auto_generated)
      end
    rescue => ex
      log = InfrastructureLog.create(
        infrastructure_id: infra_id, user_id: user_id, status: false,
        details: "servertest for #{physical_id} is failed. results: \n#{ex.message}"
      )
      @ws.push_as_json({message: log.details, status: log.status, timestamp: Time.zone.now.to_s})
      raise ex
    end

    case resp[:status_text]
    when 'success'
      log_msg    = "servertest for #{physical_id} is successfully finished."
    when 'pending'
      log_msg    = "servertest for #{physical_id} is successfully finished. but have pending specs: \n#{resp[:message]}"
    when 'failed'
      log_msg    = "servertest for #{physical_id} is failed. failure specs: \n#{resp[:message]}"
    end

    log = InfrastructureLog.create(infrastructure_id: infra_id, user_id: user_id, details: log_msg, status: resp[:status])
    @ws.push_as_json({message: log.details, status: log.status, timestamp: Time.zone.now.to_s})
    Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id).servertest_ids = servertest_ids
    return resp
  end

  def infra_logger_serverspec_start(physical_id, infra_id, user_id, auto_generated, servertest_ids)
    selected_serverspecs = Servertest.where(id: servertest_ids, category: 1)

    serverspec_names = []
    serverspec_names << 'auto_generated' if auto_generated

    serverspec_names.concat(selected_serverspecs.map{|spec|
      screen_name = spec.name
      screen_name << " (#{spec.description})" if spec.description.present?
      screen_name
    })
    log_msg = "serverspec for #{physical_id} is started. serverspecs: \n#{serverspec_names.join(",\n")}"
    log = InfrastructureLog.create(infrastructure_id: infra_id, user_id: user_id, details: log_msg, status: true)
    @ws.push_as_json({message: log.details, status: log.status, timestamp: Time.zone.now.to_s})
  end

end
