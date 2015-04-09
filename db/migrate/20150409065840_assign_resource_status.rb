class AssignResourceStatus < ActiveRecord::Migration
  def up
    Resource.all.each do |r|
      next if ResourceStatus.where(resource_id: r.id).count != 0
      r.initialize_statuses
    end
  end
end
