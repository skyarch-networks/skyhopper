json.array!(@zabbix_servers) do |zabbix_server|
  json.extract! zabbix_server, :version, :details, :username, :password, :id
  json.url zabbix_server_url(zabbix_server, format: :json)

  json.fqdn_link link_to zabbix_server.fqdn.concat("/zabbix"), "//#{zabbix_server.fqdn}", target: "_blank"
  json.fqdn      zabbix_server.fqdn
  json.details   zabbix_server.details

  if current_user.admin?
    json.edit_zabbix_server_url edit_zabbix_server_path_url(zabbix_server)
    json.delete_zabbix_server_path delete_zabbix_server_path(zabbix_server)
  end
end
