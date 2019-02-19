module ZabbixServersHelper
  def edit_zabbix_server_path_url(zabbix_server, user: current_user)
    return nil unless Pundit.policy(user, zabbix_server).edit?
    return edit_zabbix_server_path(zabbix_server)
  end

  def delete_zabbix_server_path(zabbix_server, user: current_user)
    return nil unless Pundit.policy(user, zabbix_server).destroy?
    return zabbix_server_path(zabbix_server)
  end
end
