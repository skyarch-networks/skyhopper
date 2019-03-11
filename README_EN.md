# SkyHopper
A Tool for Automatic Construction of Systems (IaaS/ Infrastructure as Code)

[日本語ドキュメント](README.md)

## Notice
From SkyHopper Version 2, Chef is replaced by Ansible.  
For historical reasons, there is a part where the Chef function exists, but it will be deleted in the future.

## blog
The information on the following link destination is for Version 1.  
http://www.skyarch.net/blog/?p=2709

RSpec: [![Build Status](https://travis-ci.org/skyarch-networks/skyhopper.svg?branch=master)](https://travis-ci.org/skyarch-networks/skyhopper)

## Deployment steps

### Deploying Applications

[doc/installation/en/skyhopper.md](doc/installation/en/skyhopper.md)

### Zabbix Server deployment procedure for SkyHopper

[doc/installation/zabbix_server.md](doc/installation/en/zabbix_server.md)


### Ansible
Lease place your favorite Ansible role under `<project-root>/ansible/roles`.

### Update procedure

Please refer to the latest release page for reference.

https://github.com/skyarch-networks/skyhopper/releases/latest

## Known Issues

[doc/known_issues.md](doc/known_issues.md)
