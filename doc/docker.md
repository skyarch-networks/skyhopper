# Dockerを使用した開発環境の構築

## 事前準備
Dockerおよびdocker-composeをインストールしておいて下さい。

## 構築手順
```sh
$ cd <project-root>
$ cp config/database_docker.yml config/database.yml
$ touch amazonlinux2/known_hosts
$ chmod 644 amazonlinux2/known_hosts
$ docker-compose build
$ # ここで後述する「フォントのダウンロードとビルド」を行ってください
$ docker-compose run --rm app scripts/app_setup.sh
```
なお、上記の手順をそのまま実行するとMySQLのrootのパスワードは"password"になります。  
必要に応じて適切に設定してください。

### フォントのダウンロードとビルド

使用するフォントの詳細: <https://github.com/m13253/kaigen-fonts>
```sh
$ cd frontend/fonts/
$ curl -LO https://github.com/m13253/kaigen-fonts/releases/download/v1.004-1.001-1/KaigenSansJ.zip
$ unzip KaigenSansJ.zip
$ cd ../..
$ docker-compose run --rm -w /prj/skyhopper/frontend app node build_font.js fonts/KaigenSansJ/KaigenSansJ-Regular.ttf
```

## 起動手順
```sh
$ docker-compose up -d
```

## 備考
`tmp/pids/server.pid`が存在すると、起動に失敗します。  
前回終了時に正常に削除されていない場合は、そのファイルを削除してください。
