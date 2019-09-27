class RemoveZabbixUserFromAppSetting < ActiveRecord::Migration[4.2]
  def change
    remove_column :app_settings, :zabbix_user, :varchar
  end
end
