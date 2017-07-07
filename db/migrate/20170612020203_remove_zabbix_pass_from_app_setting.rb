class RemoveZabbixPassFromAppSetting < ActiveRecord::Migration
  def change
    remove_column :app_settings, :zabbix_pass, :varchar
  end
end
