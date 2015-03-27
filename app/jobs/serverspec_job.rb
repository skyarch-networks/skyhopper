class ServerspecJob < ActiveJob::Base
  queue_as :default
  include Sidekiq::Worker
  sidekiq_options retry: false

  def perform(physical_id, infra_id)
    infra = Infrastructure.find(infra_id)
    node = Node.new(physical_id)
    resource = infra.resource(physical_id)
    serverspec_ids = resource.all_serverspec_ids

    Rails.logger.warn node.run_serverspec(infra_id, serverspec_ids, false)
  rescue => ex
    Rails.logger.warn(ex)
  end
end
