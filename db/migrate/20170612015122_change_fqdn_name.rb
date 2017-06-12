class ChangeFqdnName < ActiveRecord::Migration
  def change
    rename_column :app_settings, :zabbix_fqdn, :fqdn
  end
end
