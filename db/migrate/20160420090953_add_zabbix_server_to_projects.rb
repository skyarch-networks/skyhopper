class AddZabbixServerToProjects < ActiveRecord::Migration[4.2]
  def change
    add_reference :projects, :zabbix_server, index: true, foreign_key: true
  end
end
