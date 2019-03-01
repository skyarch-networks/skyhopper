# SkyHopper
システム自動構築ツール

[English Readme](README_EN.md)

## Notice
SkyHopper Version2から、ChefはAnsibleに置き換えられます。  
Chef機能が存在していた名残がありますが、将来的には削除される予定です。

## blog
以下のリンク先の情報はVersion1のものです。  
http://www.skyarch.net/blog/?p=2709

RSpec: [![Build Status](https://travis-ci.org/skyarch-networks/skyhopper.svg?branch=master)](https://travis-ci.org/skyarch-networks/skyhopper)

## デプロイ手順フロー

### アプリケーションのデプロイ

[doc/installation/skyhopper.md](doc/installation/skyhopper.md)

### SkyHopperで使用するZabbix Serverのデプロイ手順

[doc/installation/zabbix_server.md](doc/installation/zabbix_server.md)


### Ansible
`<project-root>/ansible/roles`配下にお好きなAnsibleロールを配置してください。

### アップデート手順

最新のリリースページを参考にしてください。

https://github.com/skyarch-networks/skyhopper/releases/latest

## 既知の問題

[doc/known_issues.md](doc/known_issues.md)
