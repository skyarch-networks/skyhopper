#!/usr/bin/env bash
cp /etc/zabbix/zabbix_agentd.conf /etc/zabbix/zabbix_agentd.conf.orig
sed -i -e "s/Server=127.0.0.1/Server=$1/i" /etc/zabbix/zabbix_agentd.conf
sed -i -e "s/ServerActive=127.0.0.1/ServerActive=$1/i" /etc/zabbix/zabbix_agentd.conf
sed -i -e "s/Hostname=Zabbix server/Hostname=$2/i" /etc/zabbix/zabbix_agentd.conf
