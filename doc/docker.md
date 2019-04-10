# Dockerを使用した開発環境の構築

## 事前準備
Dockerおよびdocker-composeをインストールしておいて下さい。

## 構築手順
フォントをビルドします。  
その後、以下のコマンドを実行します。
```
$ cd <project-root>
$ cp config/database_docker.yml config/database.yml
$ touch amazonlinux2/known_hosts
$ chmod 644 amazonlinux2/known_hosts
$ docker-compose build
$ docker-compose run --rm app /prj/skyhopper/scripts/app-setup.sh
```

## 起動手順
```
$ docker-compose up -d
```

## 備考
`tmp/pids/server.pid`が存在すると、起動に失敗します。  
前回終了時に正常に削除されていない場合は、そのファイルを削除してください。
