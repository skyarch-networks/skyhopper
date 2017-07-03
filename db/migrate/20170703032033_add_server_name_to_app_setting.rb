class AddServerNameToAppSetting < ActiveRecord::Migration
  def change
    add_column :app_settings, :server_name, :string
  end
end
