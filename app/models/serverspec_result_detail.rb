class ServerspecResultDetail < ActiveRecord::Base
  belongs_to :serverspec
  belongs_to :serverspec_result
end
