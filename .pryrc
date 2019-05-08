# @return [Zabbix]
def z
  a = AppSetting.get
  @z ||= Zabbix.new(a.zabbix_user, a.zabbix_pass)
end
