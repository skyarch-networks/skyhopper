Zabbix Server のデプロイ方法
============================

SkyHopper は Zabbix と連携してインフラストラクチャの監視を行っています。
そのため、SkyHopper をデプロイしたら、最初に Zabbix Server をデプロイする必要があります。


1 サインアップ
-----------------

デプロイ直後でユーザーが存在しないため、まずは SkyHopper にサインアップします。

デプロイした SkyHopper にアクセスし、Sign up へと進み、ユーザー名とメールアドレスを入力、Admin と Master にチェックを入れてユーザーを作成してください。


2 ユーザー情報の設定
-------------------------

画面左上の設定から、Zabbix Server を選択してください。
username と password を入力してください。
デフォルト値は、admin, ilikerandompasswords です。

最後に SkyHopper 上のユーザーと Zabbix のユーザーの情報の同期を行います。
右上のユーザー名をクリックし、ユーザー管理のページに行ってください。
そのページの `Zabbix Server と同期`ボタンを押すと、ユーザーが同期されます。


以上で Zabbix Server の設定は完了です。
