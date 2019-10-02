class RelationProjectsCloudProvider < ActiveRecord::Migration[4.2]
  def change
    add_column :projects, :cloud_provider_id, :integer
  end
end
