class ServerspecJob < ActiveJob::Base
  queue_as :default
  include Sidekiq::Worker
  sidekiq_options retry: false

  # Serverspec を実行し、結果をインフラログに書き出す。
  # また、Resource の Serverspec IDs を更新する。
  # @param [String] physical_id ID of EC2 Instance
  # @param [Integer] infra_id
  # @param [Integer] user_id このユーザーで Serverspec が実行される
  # @param [Array<Integer>] serverspec_ids 指定されていなければ、Resource に紐付いた Serverspec を実行する。
  #                                        指定されていれば、指定した Serverspec を実行する。
  # @param [Boolean] auto_generated
  def perform(physical_id, infra_id, user_id, serverspec_ids: nil, auto_generated: false)
    node = Node.new(physical_id)
    unless serverspec_ids
      infra = Infrastructure.find(infra_id)
      resource = infra.resource(physical_id)
      serverspec_ids = resource.all_serverspec_ids
    end

    ws = WSConnector.new('notifications', User.find(user_id).ws_key)

    begin
      resp = node.run_serverspec(infra_id, serverspec_ids, auto_generated)
    rescue => ex
      log = InfrastructureLog.create(
        infrastructure_id: infra_id, user_id: user_id, status: false,
        details: "serverspec for #{physical_id} is failed. results: \n#{ex.message}"
      )
      ws.push_as_json({message: log.details, status: log.status, timestamp: Time.now.to_s})
      raise ex
    end

    case resp[:status_text]
    when ServerspecStatus::Success
      log_msg    = "serverspec for #{physical_id} is successfully finished."
    when ServerspecStatus::Pending
      log_msg    = "serverspec for #{physical_id} is successfully finished. but have pending specs: \n#{resp[:message]}"
    when ServerspecStatus::Failed
      log_msg    = "serverspec for #{physical_id} is failed. failure specs: \n#{resp[:message]}"
    end

    log = InfrastructureLog.create(infrastructure_id: infra_id, user_id: user_id, details: log_msg, status: resp[:status])
    ws.push_as_json({message: log.details, status: log.status, timestamp: Time.now.to_s})
    Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id).serverspec_ids = serverspec_ids
    return resp
  end
end
