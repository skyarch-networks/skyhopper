class AddZabbixInfoToAppSetting < ActiveRecord::Migration
  def change
    add_column :app_settings, :zabbix_fqdn, :string
    add_column :app_settings, :zabbix_user, :string
    add_column :app_settings, :zabbix_pass, :string
  end
end
