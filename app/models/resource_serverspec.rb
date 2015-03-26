class ResourceServerspec < ActiveRecord::Base
  belongs_to :resource,   dependent: :destroy
  belongs_to :serverspec, dependent: :destroy
end
