json.array!(@zabbix_servers) do |zabbix_server|
  json.extract! zabbix_server, :id, :fqdn, :username, :password, :version, :details
  json.url zabbix_server_url(zabbix_server, format: :json)
end
