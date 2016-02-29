# SkyHopper deployment procedure

By using [SkyHopper Cookbooks](https://github.com/skyarch-networks/skyhopper_cookbooks/tree/master/cookbooks/skyhopper), you can automate your system by installing a package.

If you used cookbook, we will proceed to [SkyHopper Setup](#skyhopper-setup).


## Prefered OS

Amazon Linux (RHEL System)

You can also use SkyHopper in Ubuntu, Archlinux by installing the corresponding packages found in Amazon Linux.

## Installing Ruby

To install, you need ruby 2.2 version(SkyHopper doesn't work with Ruby 2.3).

```sh
$ sudo yum remove ruby ruby20
$ sudo yum install ruby22
$ ruby -v
ruby 2.2.2p95 (2015-04-13 revision 50295) [x86_64-linux-gnu]
```

## Installing Bundler using gem

```sh
$ sudo gem install bundler
```

## Installing nodejs and npm using yum

```sh
$ sudo yum install nodejs npm --enablerepo=epel
$ sudo npm update -g npm
$ node -v
v0.10.36
```

## Installing bower using npm

```sh
$ sudo npm install bower --global
```

## Installing other packages that are needed for SkyHopper using yum

```sh
$ sudo yum groupinstall 'Development tools' 'Development Libraries'
$ sudo yum install ruby22-devel sqlite-devel zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel mysql-devel mysql-server nginx
$ sudo yum --enablerepo=epel install redis
```


## nginx Proxy Settings

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
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

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
        server_name skyhopper.local; #Setting the environment

        location ~ ^/(assets|fonts) {
          root /home/ec2-user/skyhopper/public; # your skyhopper installation is located
        }

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

## Starting of Services

```sh
$ sudo chkconfig redis on
$ sudo service redis start

$ sudo chkconfig mysqld on
$ sudo service mysqld start

$ sudo chkconfig nginx on
$ sudo service nginx start
```

## Downloading/Cloning SkyHopper from GitHub

```sh
$ cd ~ #the directory where you want to install SkyHopper
$ git clone https://github.com/skyarch-networks/skyhopper.git
```



Up to this point it can be executed by Chef.

---------------------------------

## SkyHopper Setup

```sh
$ cd skyhopper
```

## Specify SkyHopper version

```sh
$ git checkout v1.9.0
```

### Creating MySQL user

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



### bundle install

```sh
$ bundle install --path vendor/bundle
```

### bower install

```sh
$ bower install
```

### Compiling TypeScript

```sh
$ sudo npm i -g gulp
$ cd frontend/
$ npm i
$ gulp tsd
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
  password: 'hogehoge' #development password that you set earlier
```

#### production

```yaml
production:
  <<: *default
  database: SkyHopperProduction
  username: skyhopper_prod
  password: 'fugafuga' #production password that you set earlier
```


## Database Setup

### Creating database using rake

```sh
$ bundle exec rake db:create
```

### Creating tables using rake

```sh
# development
$ bundle exec rake db:migrate
# production
$ bundle exec rake db:migrate RAILS_ENV=production
```

### creating initial data using rake

```sh
# development
$ bundle exec rake db:seed
# production
$ bundle exec rake db:seed RAILS_ENV=production
```



## Start

Running Skyhopper

```sh
# production
$ ./scripts/skyhopper_daemon.sh start
# usage start|stop|status
# staring mode for daemon
```

```sh
# for development
$ ./scripts/dev_server.sh
# to stop/exit, press: Ctrl + C
```

## Initializing settings for SkyHopper

Perform the initial set up from the browser by accessing SkyHopper


## Establishing the Chef Server keys

Copy the installation files under the project directory of SkyHopper `tmp/chef` to ` ~/.chef`
```sh
$ cp -r ~/skyhopper/tmp/chef ~/.chef
```

Restart SkyHopper
```sh
$ ./scripts/skyhopper_daemon.sh stop
$ ./scripts/skyhopper_daemon.sh start
```
