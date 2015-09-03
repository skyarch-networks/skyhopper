class ServerspecResult < ActiveRecord::Base
  belongs_to :resource
  has_many :serverspec_result_details
  has_many :serverspecs, through: :serverspec_result_details
  enum status: [ :success, :pending, :failed ]
end
