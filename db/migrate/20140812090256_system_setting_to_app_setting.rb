class SystemSettingToAppSetting < ActiveRecord::Migration
  def change
    rename_table :system_settings, :app_settings
  end
end
