class CreateUserZabbixServers < ActiveRecord::Migration[4.2]
  def change
    create_table :user_zabbix_servers, id: false, force: true do |t|
      t.references :user,  null: false
      t.references :zabbix_server, null: false
    end
    add_index :user_zabbix_servers, [:zabbix_server_id, :user_id], name: "index_user_zabbix_servers_on_user_id_and_zabbix_server_id", unique: true, using: :btree
    add_index :user_zabbix_servers, :user_id, name: "user_zabbix_servers_zabbix_server_id_fk", using: :btree

    add_foreign_key :user_zabbix_servers, "zabbix_servers", on_delete: :cascade
    add_foreign_key :user_zabbix_servers, "users", on_delete: :cascade
  end
end
