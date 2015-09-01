class ServerspecResult < ActiveRecord::Base
  belongs_to :resource
  has_many :serverspec_result_details

  class << self
    def generateResult(resource, serverspec_ids, status, message)
      result = self.create(
        resource_id: resource.id,
        status: status,
        message: message
      )

      serverspec_ids.each{|x|
        ServerspecResultDetail.create(
          serverspec_id: x,
          serverspec_result_id: result.id
        )
      }
    end
  end
end
