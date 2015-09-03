class ServerspecResult < ActiveRecord::Base
  belongs_to :resource
  has_many :serverspecs, through: :serverspec_result_details
  enum status: [ :success, :pending, :failed ]

  class << self
    def generateResult(resource, serverspec_ids, status, message)
      result = self.create(
        resource_id: resource.id,
        status: status,
        message: message,
        serverspec_ids: serverspec_ids
      )
    end
  end
end
