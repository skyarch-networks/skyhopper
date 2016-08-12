module ZabbixServersHelper
  def edit_zabbix_server_path_url(zabbix_server)
    return nil unless Pundit.policy(current_user, zabbix_server).edit?
    return edit_zabbix_server_path(zabbix_server)
  end

  def delete_zabbix_server_path(zabbix_server)
    return nil unless Pundit.policy(current_user, zabbix_server).destroy?
    # Exclude the default zabbix server from deletion
    return nil if zabbix_server.id == 1
    return zabbix_server_path(zabbix_server)
  end
end
