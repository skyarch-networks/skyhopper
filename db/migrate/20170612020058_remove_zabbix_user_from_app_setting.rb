class RemoveZabbixUserFromAppSetting < ActiveRecord::Migration
  def change
    remove_column :app_settings, :zabbix_user, :varchar
  end
end
