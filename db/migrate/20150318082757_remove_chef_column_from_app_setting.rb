class RemoveChefColumnFromAppSetting < ActiveRecord::Migration[4.2]
  def change
    remove_column :app_settings, :chef_url
    remove_column :app_settings, :chef_name
    remove_column :app_settings, :chef_key
  end
end
