zabbix-agent
=========

Install zabbix-agent for Amazon Linux


Environment
-----------

Tested on Amazon Linux(1 and 2)

Role Variables
--------------

extra-vars
- agent_version : zabbix major version
- zabbix_server_address : zabbix server ip address or FQDN

Example
----------------

extra-vars


    {"agent_version": "2.2","zabbix_server_address": "<zabbix_server_fqdn>"}
