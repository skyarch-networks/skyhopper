class ChangeFqdnName < ActiveRecord::Migration[4.2]
  def change
    rename_column :app_settings, :zabbix_fqdn, :fqdn
  end
end
