# SkyHopper デプロイ手順

## 対象

Amazon Linux (RHEL系)

Amazon Linux へのインストール方法しか記載していませんが、対応するパッケージを入れることによって Ubuntu や Arch Linux でも SkyHopper を動作させることが出来ます。

## ruby のインストール

Ruby 2.4系をインストール

```sh
$ sudo yum remove ruby ruby20
$ sudo yum install ruby24
$ ruby -v
ruby 2.4.4p296 (2018-03-28 revision 63013) [x86_64-linux-gnu]
```

## Bundler のインストール

```sh
$ sudo gem install bundler
```

## node.js のインストール
###### ref: [link](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html)
```sh
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
$ . ~/.nvm/nvm.sh
$ nvm install --lts=dubnium
# update npm to lastest version
$ npm update -g npm
$ node -v
v10.X.X # any current stable version release
```

## Yarn のインストール

```sh
$ curl -o- -L https://yarnpkg.com/install.sh | bash
(シェルからログアウトし、再度ログインしてください)
$ yarn -v
1.10.1
```

## SkyHopper に必要なパッケージをインストール

```sh
$ sudo yum groupinstall 'Development tools' 'Development Libraries'
$ sudo yum install ruby24-devel sqlite-devel zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel mysql-devel mysql-server nginx
$ sudo rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
$ sudo yum --enablerepo=remi,remi-test install redis
$ sudo yum install ansible --enablerepo=epel
```

## Ansibleの設定

```sh
$ sudo vim /etc/ansible/ansible.cfg
(以下の行をアンコメントしてください)
#retry_files_enabled = False
↓
retry_files_enabled = False
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
        # もしskyhopperをcloneした場所が異なる場合修正
        set \$skyhopper_root "/home/ec2-user/skyhopper";

        client_max_body_size 1g;

        listen 80;
        server_name skyhopper.local; #環境に合わせて設定

        ### ここから production で動かす場合のみ ###
        location ~ ^/(assets|fonts) {
          root \$skyhopper_root/public;
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

        location /502.html {
            root \$skyhopper_root/public;
            try_files \$uri 502.html;
        }
        error_page 502 /502.html;
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

### MySQL ユーザーの作成

```sh
$ mysql -uroot
```

#### development

```sh
mysql> CREATE USER 'skyhopper_dev'@'localhost' IDENTIFIED BY 'hogehoge';
mysql> GRANT CREATE, SHOW DATABASES ON *.* TO 'skyhopper_dev'@'localhost';
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperDevelopment`.* TO 'skyhopper_dev'@'localhost';
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperTest`.* TO 'skyhopper_dev'@'localhost';
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

### Yarn

```sh
$ cd frontend/
$ yarn
$ cd ..
```

### フォントのダウンロードとビルド

使用するフォントの詳細: <https://github.com/m13253/kaigen-fonts>
```sh
$ cd frontend/fonts/
$ curl -LO https://github.com/m13253/kaigen-fonts/releases/download/v1.004-1.001-1/KaigenSansJ.zip
$ unzip KaigenSansJ.zip
$ cd ..
$ node build_font.js fonts/KaigenSansJ/KaigenSansJ-Regular.ttf
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

```sh
# development
$ bundle exec rails db:setup
# production
$ bundle exec rails db:setup RAILS_ENV=production
```

## ホームディレクトリのパーミッションを変更

```sh
$ chmod 711 ~
```

### [注意]開発中のSkyhopperを起動する前に、このスクリプトを実行してください
```sh
# i18n-js辞書を生成する
$ bundle exec rails i18n:js:export
# アセットのプリコンパイル用
$ bundle exec rails assets:precompile
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
