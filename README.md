# SkyHopper
システム自動構築ツール

[English Readme](README_EN.md)

## Notice
SkyHopper Version2から、ChefはAnsibleに置き換えられます。  
Chefの機能の一部はまだ使える状態ですが、将来的には削除される予定です。

## blog
以下のリンク先の情報はVersion1のものです。  
http://www.skyarch.net/blog/?p=2709

RSpec: [![Build Status](https://travis-ci.org/skyarch-networks/skyhopper.svg?branch=master)](https://travis-ci.org/skyarch-networks/skyhopper)

## デプロイ手順フロー
Chefの機能に一部の処理が依存していため、Chefのインストールが必要です。
Chefの機能は将来的に削除される予定です。

### アプリケーションのデプロイ

[doc/installation/skyhopper.md](doc/installation/skyhopper.md)

### Cookbook/Roleのアップロード

[doc/installation/upload_cookbooks.md](doc/installation/upload_cookbooks.md)


### SkyHopperで使用するZabbix Serverのデプロイ手順

[doc/installation/zabbix_server.md](doc/installation/zabbix_server.md)


### Ansible
`<project-root>/ansible/roles`配下にお好きなAnsibleロールを配置してください。

### アップデート手順

最新のリリースページを参考にしてください。

https://github.com/skyarch-networks/skyhopper/releases/latest

## 既知の問題

[doc/known_issues.md](doc/known_issues.md)
