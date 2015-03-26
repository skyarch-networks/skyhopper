class ResourceServerspec < ActiveRecord::Base
  belongs_to :dish,       dependent: :destroy
  belongs_to :serverspec, dependent: :destroy
end
