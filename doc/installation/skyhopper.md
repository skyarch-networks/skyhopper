# SkyHopperデプロイ手順

- 対象
  - Amazon Linux (RHEL系)
  - Ubuntu (Debian系)

## rubyのインストール

Ruby 2.1系以上のRubyをインストール

### Amazon Linux
```sh
$ sudo yum remove ruby ruby20
$ sudo yum install ruby21
$ ruby -v
ruby 2.1.5p273 (2014-11-13 revision 48405) [x86_64-linux-gnu]
```

### Ubuntu
#### システムのRubyをアンインストール

```sh
$ sudo apt-get remove ruby
```

#### ビルドに必要なパッケージをインストール

```sh
$ sudo apt-get install -y build-essential zlib1g-dev libyaml-dev libssl-dev libgdbm-dev libreadline-dev libncurses5-dev libffi-dev curl openssh-server redis-server checkinstall libxml2-dev libxslt-dev libcurl4-openssl-dev libicu-dev
```

#### 最新のソースをダウンロード、ビルド、およびインストール

```sh
$ wget http://cache.ruby-lang.org/pub/ruby/2.2/ruby-2.2.0.tar.gz
$ tar zxvf ruby-2.2.0.tar.gz
$ cd ruby-2.2.0
$ ./configure --disable-install-rdoc
$ make
$ sudo make install
```

### Bundlerのインストール

```sh
$ sudo gem install bundler
```

## node.jsのインストール

### Amazon Linux
```sh
$ sudo yum install nodejs npm --enablerepo=epel
$ node -v
v0.10.33
```


### Ubuntu
```sh
$ sudo apt-get install nodejs npm
$ sudo ln -s /usr/bin/nodejs /usr/bin/node
$ node -v
v0.10.25
```

### bowerのインストール
```sh
$ sudo npm install bower --global
```

## SkyHopperに必要なパッケージをインストール

#### Amazon Linux

```sh
$ sudo yum groupinstall 'Development tools' 'Development Libraries'
$ sudo yum install ruby21-devel sqlite-devel
$ sudo yum install zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel
$ sudo yum --enablerepo=epel install redis
```

```sh
$ sudo chkconfig redis on
$ sudo service redis start
```

#### Ubuntu

```sh
$ sudo apt-get install redis-server
# TODO:
```


## MySQLのセットアップ

### インストール

#### Amazon Linux

```sh
$ sudo yum install mysql-devel mysql-server mysql-client
$ sudo chkconfig mysqld on
$ sudo service mysqld start
```

#### Ubuntu

```sh
$ sudo apt-get install mysql-server mysql-client libmysqlclient-dev
$ sudo service mysql start
```

### MySQLユーザーの作成

```sh
$ mysql -uroot
```

#### development

```sh
mysql> CREATE USER 'skyhopper_dev'@'localhost' IDENTIFIED BY 'hogehoge';
mysql> GRANT CREATE, SHOW DATABASES ON *.* TO 'skyhopper_dev'@'localhost';
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperDevelopment`.* TO 'skyhopper_dev'@'localhost';
mysql> \q
```

#### production

```sh
mysql> SET storage_engine=INNODB;
mysql> CREATE USER 'skyhopper_prod'@'localhost' IDENTIFIED BY 'fugafuga';
mysql> CREATE DATABASE IF NOT EXISTS `SkyHopperProduction` DEFAULT CHARACTER SET `utf8` COLLATE `utf8_unicode_ci`;
mysql> GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON `SkyHopperProduction`.* TO 'skyhopper_prod'@'localhost';
mysql> \q
```


## SkyHopperのダウンロード

### リポジトリからclone

```sh
$ cd ~ #SkyHopperを設置したいディレクトリへ移動
$ git clone https://github.com/skyarch-networks/skyhopper.git
```


## SkyHopperのセットアップ

### bundle install

```sh
$ cd skyhopper
$ bundle install --path vendor/bundle
```

### bower install

```sh
$ bower install
```

### database.yml

```sh
$ cp config/database_default.yml config/database.yml
```
#### development

##### Amazon Linux

```yaml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: 5
  username: skyhopper_dev
  password: 'hogehoge' #先ほど設定したdevelopmentのパスワード
  socket: /var/lib/mysql/mysql.sock
```


##### Ubuntu

```yaml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: 5
  username: skyhopper_dev
  password: 'hogehoge' #先ほど設定したdevelopmentのパスワード
  socket: /var/run/mysqld/mysqld.sock
```


#### production

```yaml
production:
  <<: #default
  database: SkyHopperProduction
  username: skyhopper_prod
  password: 'fugafuga' #先ほど設定したproductionのパスワード
```


## DBのセットアップ

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


## リバースプロキシの設定

### インストール

#### Amazon Linux

```sh
# もしCentOS 6以前を使っている場合古いnginxが入ってしまいWebsocketに対応しない場合があるので、以下を実行。
$ sudo rpm -ivh http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
```

```sh
$ sudo yum install nginx
$ sudo chkconfig nginx on
$ sudo service nginx start
```

#### Ubuntu

```sh
$ sudo apt-get install nginx
```

### 設定ファイルを設置

#### Amazon Linux

```
$ sudo tee /etc/nginx/conf.d/skyhopper.conf <<EOF >/dev/null
server {
        listen 80;
        server_name skyhopper.local; #環境に合わせて設定

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

$ sudo service nginx restart
```

#### Ubuntu

```
$ sudo tee /etc/nginx/sites-available/skyhopper <<EOF >/dev/null
server {
        listen 80;
        server_name skyhopper.local; #環境に合わせて設定

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

$ sudo ln -s /etc/nginx/sites-available/skyhopper /etc/nginx/sites-enabled/skyhopper
$ sudo service nginx restart
```


## 起動

SkyHopperの実行は以下

```sh
# development
$ ./scripts/dev_server.sh
# 終了は Ctrl + C
```

```sh
# production
$ ./scripts/skyhopper_daemon.sh start
# usage start|stop|status
# daemonモードで起動
```


## SkyHopperの初期設定

ブラウザからSkyHopperにアクセスし、初期設定を行ってください


## Chef Serverの鍵を設置

SkyHopperのプロジェクトディレクトリ下の`tmp/chef`内のファイルを`~/.chef`に設置
```sh
$ cp -r ~/skyhopper/tmp/chef ~/.chef
```

SkyHopperの再起動
```sh
$ ./scripts/skyhopper_daemon.sh stop
$ ./scripts/skyhopper_daemon.sh start
```
