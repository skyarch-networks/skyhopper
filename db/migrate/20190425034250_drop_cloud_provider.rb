class DropCloudProvider < ActiveRecord::Migration[4.2]
  def change
    remove_column :projects, :cloud_provider_id
    drop_table :cloud_providers
  end
end
