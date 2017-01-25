# SkyHopper デプロイ手順

[SkyHopper 用の Cookbook](https://github.com/skyarch-networks/skyhopper_cookbooks/tree/master/cookbooks/skyhopper)
を使用することで、パッケージのインストールなどを自動化することが出来ます。

Cookbook を使用した場合は、[MySQL ユーザーの作成](#user-content-mysql-ユーザーの作成) から実行していきます。


## 対象

Amazon Linux (RHEL系)

Amazon Linux へのインストール方法しか記載していませんが、対応するパッケージを入れることによって Ubuntu や Arch Linux でも SkyHopper を動作させることが出来ます。

## ruby のインストール

Ruby 2.2系をインストール(Ruby 2.3 系では動きません)

```sh
$ sudo yum remove ruby ruby20
$ sudo yum install ruby22
$ ruby -v
ruby 2.2.2p95 (2015-04-13 revision 50295) [x86_64-linux-gnu]
```

## Bundler のインストール

```sh
$ sudo gem install bundler
```

## node.js のインストール

```sh
$ sudo yum install nodejs npm --enablerepo=epel
$ sudo npm update -g npm
$ node -v
v0.10.36
```

## bower のインストール

```sh
$ sudo npm install bower --global
```

## SkyHopper に必要なパッケージをインストール

```sh
$ sudo yum groupinstall 'Development tools' 'Development Libraries'
$ sudo yum install ruby22-devel sqlite-devel zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel mysql-devel mysql-server nginx
$ sudo rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
$ sudo yum --enablerepo=remi,remi-test install redis
```


## リバースプロキシ(nginx)の設定

```sh
$ sudo tee /etc/nginx/nginx.conf <<EOF >/dev/null
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
EOF
```

```sh
$ sudo tee /etc/nginx/conf.d/skyhopper.conf <<EOF >/dev/null
server {
        listen 80;
        server_name skyhopper.local; #環境に合わせて設定

        ### ここから production で動かす場合のみ ###
        location ~ ^/(assets|fonts) {
          root /home/ec2-user/skyhopper/public; # もしskyhopperをcloneした場所が異なる場合修正
        }
        ### ここまで production で動かす場合のみ ###

        location / {
            proxy_set_header    X-Real-IP   \$remote_addr;
            proxy_set_header    Host    \$http_host;
            proxy_pass  http://127.0.0.1:3000;
        }

        location /ws {
            proxy_http_version 1.1;
            proxy_set_header    Upgrade \$http_upgrade;
            proxy_set_header    Connection "upgrade";
            proxy_set_header    Host    \$http_host;
            proxy_pass http://127.0.0.1:3210;
        }
}
EOF
```

## サービスの起動

```sh
$ sudo chkconfig redis on
$ sudo service redis start

$ sudo chkconfig mysqld on
$ sudo service mysqld start

$ sudo chkconfig nginx on
$ sudo service nginx start
```

## SkyHopper のダウンロード

```sh
$ cd ~ #SkyHopperを設置したいディレクトリへ移動
$ git clone https://github.com/skyarch-networks/skyhopper.git
```


ここまでは Chef によって実行することが出来ます。

---------------------------------

### MySQL ユーザーの作成

```sh
$ mysql -uroot
```

#### development

```sh
mysql> CREATE USER 'skyhopper_dev'@'localhost' IDENTIFIED BY 'hogehoge';
mysql> GRANT CREATE, SHOW DATABASES ON *.* TO 'skyhopper_dev'@'localhost';
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperDevelopment`.* TO 'skyhopper_dev'@'localhost';
mysql> exit
```

#### production

```sh
mysql> SET storage_engine=INNODB;
mysql> CREATE USER 'skyhopper_prod'@'localhost' IDENTIFIED BY 'fugafuga';
mysql> CREATE DATABASE IF NOT EXISTS `SkyHopperProduction` DEFAULT CHARACTER SET `utf8` COLLATE `utf8_unicode_ci`;
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperProduction`.* TO 'skyhopper_prod'@'localhost';
mysql> exit
```



## SkyHopper のセットアップ

```sh
$ cd skyhopper
```

### SkyHopper のバージョン指定

```sh
$ git checkout <使いたいSkyHopperのバージョン>
```

### bundle install

```sh
$ bundle install --path vendor/bundle
```

### bower install

```sh
$ bower install
```

### TypeScript のコンパイル

```sh
$ sudo npm i -g gulp
$ cd frontend/
$ npm i
$ gulp type  //TSD to typings
$ gulp ts
$ cd ..
```

### database.yml

```sh
$ cp config/database_default.yml config/database.yml
```

#### development

```yaml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: 5
  username: skyhopper_dev
  password: 'hogehoge' #先ほど設定したdevelopmentのパスワード
```

#### production

```yaml
production:
  <<: *default
  database: SkyHopperProduction
  username: skyhopper_prod
  password: 'fugafuga' #先ほど設定したproductionのパスワード
```


## DB のセットアップ

### データベースの作成

```sh
$ bundle exec rake db:create
```

### テーブルの作成

```sh
# development
$ bundle exec rake db:migrate
# production
$ bundle exec rake db:migrate RAILS_ENV=production
```

### 初期データの挿入

```sh
# development
$ bundle exec rake db:seed
# production
$ bundle exec rake db:seed RAILS_ENV=production
```

## ホームディレクトリのパーミッションを変更

```sh
$ chmod 711 ~
```


## 起動

SkyHopper の実行は以下

```sh
# production
$ ./scripts/skyhopper_daemon.sh start
# usage start|stop|status
# daemon モードで起動
```

```sh
# developmentの場合は下記
$ ./scripts/dev_server.sh
# 終了は Ctrl + C
```

## SkyHopper の初期設定

ブラウザから SkyHopper にアクセスし、初期設定を行ってください


## Chef Server の鍵を設置

SkyHopper のプロジェクトディレクトリ下の`tmp/chef`内のファイルを`~/.chef`に設置
```sh
$ cp -r ~/skyhopper/tmp/chef ~/.chef
```

SkyHopper の再起動
```sh
$ ./scripts/skyhopper_daemon.sh stop
$ ./scripts/skyhopper_daemon.sh start
```
