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
  def perform(physical_id, infra_id, user_id, servertest_ids: nil, category: nil)
    node = Node.new(physical_id)
    unless servertest_ids
      infra = Infrastructure.find(infra_id)
      resource = infra.resource(physical_id)
      servertest_ids = resource.all_servertest_ids
    end

    @ws = WSConnector.new('notifications', User.find(user_id).ws_key)

    infra_logger_serverspec_start(physical_id, infra_id, user_id, servertest_ids)
    begin
      resp = if category.nil?
               node.run_serverspec(infra_id, servertest_ids)
             else
               auto_generated = false # 過去に存在していた機能
        node.run_awsspec(infra_id, servertest_ids, auto_generated)
      end
    rescue StandardError => ex
      log = InfrastructureLog.create(
        infrastructure_id: infra_id, user_id: user_id, status: false,
        details: "servertest for #{physical_id} is failed. results: \n#{ex.message}",
      )
      @ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
      raise ex
    end

    case resp[:status_text]
    when 'success'
      log_msg    = "servertest for #{physical_id} is successfully finished."
    when 'pending'
      log_msg    = "servertest for #{physical_id} is successfully finished. but have pending specs: \n#{resp[:message]}"
    when 'failed'
      log_msg    = "servertest for #{physical_id} is failed. failure specs: \n#{resp[:message]}"
    when 'error'
      log_msg    = "servertest of #{physical_id} caused an error. specs where the error occurred: #{resp[:error_servertest_names].join(',')}"
    end

    log = InfrastructureLog.create(infrastructure_id: infra_id, user_id: user_id, details: log_msg, status: resp[:status])
    @ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
    Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id).servertest_ids = servertest_ids
    resp
  end

  def infra_logger_serverspec_start(physical_id, infra_id, user_id, servertest_ids)
    selected_serverspecs = Servertest.where(id: servertest_ids, category: 1)

    serverspec_names = selected_serverspecs.map do |spec|
      screen_name = spec.name
      screen_name << " (#{spec.description})" if spec.description.present?
      screen_name
    end
    log_msg = "serverspec for #{physical_id} is started. serverspecs: \n#{serverspec_names.join(",\n")}"
    log = InfrastructureLog.create(infrastructure_id: infra_id, user_id: user_id, details: log_msg, status: true)
    @ws.push_as_json({ message: log.details, status: log.status, timestamp: Time.zone.now.to_s })
  end
end
