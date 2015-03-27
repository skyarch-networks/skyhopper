class ServerspecJob < ActiveJob::Base
  queue_as :default

  def perform(physical_id, infra_id)
    infra = Infrastructure.find(infra_id)
    node = Node.new(physical_id)
    resource = infra.resource(physical_id)
  end
end
