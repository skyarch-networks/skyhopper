class UniqueCloudProviderName < ActiveRecord::Migration[4.2]
  def change
    add_index :cloud_providers, :name, unique: true
  end
end
