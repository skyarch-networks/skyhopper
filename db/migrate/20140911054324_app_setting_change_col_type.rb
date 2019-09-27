class AppSettingChangeColType < ActiveRecord::Migration[4.2]
  def up
    change_column :app_settings, :chef_key, :text
  end

  def down
    change_column :app_settings, :chef_key, :string
  end
end
