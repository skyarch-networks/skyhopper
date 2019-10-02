class AssignResourceStatus < ActiveRecord::Migration[4.2]
  def up
    Resource.all.each do |r|
      next if ResourceStatus.where(resource_id: r.id).count.nonzero?
      r.initialize_statuses
    end
  end
end
