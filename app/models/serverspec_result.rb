class ServerspecResult < ActiveRecord::Base
  belongs_to :resource
  has_many :serverspec_result_details
end
