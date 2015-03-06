# @return [Zabbix]
def z
  a = AppSetting.get
  return @z ||= Zabbix.new(a.zabbix_user, a.zabbix_pass)
end
