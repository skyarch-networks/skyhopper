class AddZabbixInfoToAppSetting < ActiveRecord::Migration[4.2]
  def change
    add_column :app_settings, :zabbix_fqdn, :string
    add_column :app_settings, :zabbix_user, :string
    add_column :app_settings, :zabbix_pass, :string
  end
end
