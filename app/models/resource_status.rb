class ResourceStatus < ActiveRecord::Base
  belongs_to :resource

  enum value:  %i(success failed pending un_executed inprogress)
  enum kind:   %i(serverspec cook yum)

  kinds.each do |k, v|
    scope k, -> { find_by(kind: v) }
  end
end
