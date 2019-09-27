class SystemSettingToAppSetting < ActiveRecord::Migration[4.2]
  def change
    rename_table :system_settings,  :app_settings
  end
end
