Zabbix Server のデプロイ方法
============================

SkyHopper は Zabbix と連携してインフラストラクチャの監視を行っています。
そのため、SkyHopper をデプロイしたら、最初に Zabbix Server をデプロイする必要があります。


1 サインアップ
-----------------

デプロイ直後でユーザーが存在しないため、まずは SkyHopper にサインアップします。

デプロイした SkyHopper にアクセスし、Sign up へと進み、ユーザー名とメールアドレスを入力、Admin と Master にチェックを入れてユーザーを作成してください。


2 Zabbix Server インフラストラクチャを選択
--------------------------------------------

Zabbix Server は、SkyHopper 上でインフラストラクチャとして管理されています。
そのため、まずはそのインフラストラクチャを選択しましょう。

1. 顧客 SkyHopper の案件一覧をクリック
2. 案件 ZabbixServer のインフラ一覧をクリック
3. 存在するインフラの詳細をクリック


3 Chef Server に登録
------------------------

Chef を使用して Zabbix をインストールするため、まずは EC2 インスタンスを Chef Server に登録します。

Chef Server に登録 ボタンを押してください。


4 RunList を選択
------------------

Runlistの編集 ボタンを押してください。 Runlistの編集画面が現れます。
この画面で、どのレシピを使ってChefを実行するかを選択します。
Zabbix Server をインストールするので、Role の中にある `zabbix_server` ロールをダブルクリックして Runlist に追加してください。
変更の保存 ボタンを押すと変更が保存されます。


5 Cook
------------

Chef を実行します。
Cook を実行している状況がリアルタイムに表示されます。

Cookが終了したら Zabbix Server のデプロイは終了です。
最後に、SkyHopper に Zabbix Server のユーザー情報を設定します。

6 ユーザー情報の設定
-------------------------

画面左上の設定から、Zabbix Server を選択してください。
username と password を入力してください。
デフォルト値は、admin, ilikerandompasswords です。

最後に SkyHopper 上のユーザーと Zabbix のユーザーの情報の同期を行います。
右上のユーザー名をクリックし、ユーザー管理のページに行ってください。
そのページの `Zabbix Server と同期`ボタンを押すと、ユーザーが同期されます。


以上で Zabbix Server の設定は完了です。
