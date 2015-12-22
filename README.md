# SkyHopper
システム自動構築ツール

## Language
[English](README_EN.md) - [日本語](README.md)

## blog
http://www.skyarch.net/blog/?p=2709

RSpec: [![Build Status](https://travis-ci.org/skyarch-networks/skyhopper.svg?branch=master)](https://travis-ci.org/skyarch-networks/skyhopper)

## デプロイ手順フロー

### アプリケーションのデプロイ

[doc/installation/skyhopper.md](doc/installation/skyhopper.md)

1. rubyのインストール
1. node.jsのインストール
1. SkyHopperに必要なパッケージをインストール
1. リバースプロキシの設定
1. サービスの起動
1. SkyHopperのダウンロード
1. MySQLのセットアップ
1. SkyHopperのセットアップ
1. DBのセットアップ
1. SkyHopperの初期設定
1. Chef Serverの鍵を設置


### Cookbook/Roleのアップロード

[doc/installation/upload_cookbooks.md](doc/installation/upload_cookbooks.md)


### SkyHopperで使用するZabbix Serverのデプロイ手順

[doc/installation/zabbix_server.md](doc/installation/zabbix_server.md)


### アップデート手順

最新のリリースページを参考にしてください。

https://github.com/skyarch-networks/skyhopper/releases/latest

## 既知の問題

[doc/known_issues.md](doc/known_issues.md)
