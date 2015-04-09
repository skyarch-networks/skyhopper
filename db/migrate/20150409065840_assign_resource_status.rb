class AssignResourceStatus < ActiveRecord::Migration
  def change
    Resource.all.each do |r|
      next unless ResourceStatus.where(resource_id: r.id).empty?
      r.initialize_status
    end
  end
end
