class ResourceStatus < ActiveRecord::Base
  belongs_to :resource

  enum value:  %i(Success Failed Pending UnExecuted Inprogress)
  enum kind:   %i(serverspec cook yum)
end
