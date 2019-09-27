class CreateZabbixServers < ActiveRecord::Migration[4.2]
  def change
    create_table :zabbix_servers do |t|
      t.string :fqdn
      t.string :username
      t.string :password
      t.string :version
      t.string :details

      t.timestamps null: false
    end
  end
end
