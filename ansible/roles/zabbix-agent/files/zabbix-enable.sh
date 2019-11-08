#!/usr/bin/env bash
if test $1 = "1"; then
  /etc/init.d/zabbix-agent start
  chkconfig zabbix-agent on
else
  systemctl enable --now zabbix-agent.service
fi
