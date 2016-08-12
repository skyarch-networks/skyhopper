class AddZabbixServerToProjects < ActiveRecord::Migration
  def change
    add_reference :projects, :zabbix_server, index: true, foreign_key: true
  end
end
