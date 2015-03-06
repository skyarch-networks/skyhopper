class UniqueCloudProviderName < ActiveRecord::Migration
  def change
    add_index :cloud_providers, :name, unique: true
  end
end
