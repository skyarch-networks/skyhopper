class AddServerNameToAppSetting < ActiveRecord::Migration[4.2]
  def change
    add_column :app_settings, :server_name, :string
  end
end
