class RelationProjectsCloudProvider < ActiveRecord::Migration
  def change
    add_column :projects, :cloud_provider_id, :integer
  end
end
