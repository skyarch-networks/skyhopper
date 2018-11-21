# SkyHopper deployment procedure

By using [SkyHopper Cookbooks](https://github.com/skyarch-networks/skyhopper_cookbooks/tree/master/cookbooks/skyhopper), you can automate your system by installing a package.

If you used cookbook, we will proceed to [Creating MySQL user](#user-content-creating-mysql-user).


## Prefered OS

Amazon Linux (RHEL System)

You can also use SkyHopper in Ubuntu, Archlinux by installing the corresponding packages found in Amazon Linux.

## Installing Ruby

To install, you need ruby 2.4 version.

```sh
$ sudo yum remove ruby ruby20
$ sudo yum install ruby24
$ ruby -v
ruby 2.4.4p296 (2018-03-28 revision 63013) [x86_64-linux-gnu]
```

## Installing Bundler using gem

```sh
$ sudo gem install bundler
```

## Installing nodejs and npm using NVM

```sh
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
$ . ~/.nvm/nvm.sh
$ nvm install stable
# update npm to lastest version
$ npm update -g npm
$ node -v
v10.12.0 # any current stable version release
```

## Installing Yarn

```sh
$ curl -o- -L https://yarnpkg.com/install.sh | bash
(Log out of the shell and login again)
$ yarn -v
1.10.1
```

## Installing other packages that are needed for SkyHopper using yum

```sh
$ sudo yum groupinstall 'Development tools' 'Development Libraries'
$ sudo yum install ruby24-devel sqlite-devel zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel mysql-devel mysql-server nginx
$ sudo rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
$ sudo yum --enablerepo=remi,remi-test install redis
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
        # your skyhopper installation is located
        set \$skyhopper_root "/home/ec2-user/skyhopper";

        client_max_body_size 1g;

        listen 80;
        server_name skyhopper.local; #Setting the environment

        ### production only from here ###
        location ~ ^/(assets|fonts) {
          root \$skyhopper_root/public;
        }
        ### production only to here ###

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



## SkyHopper Setup

```sh
$ cd skyhopper
```

### Specify SkyHopper version

```sh
$ git checkout <SKYHOPPER_VERSION_YOU_WANT_TO_USE>
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

### Compiling TypeScript

```sh
$ npm i -g gulp
$ cd frontend/
$ gulp type  // TSD to typings
$ gulp ts
$ cd ..
```

### Font download and build

Details of the font to use: <https://github.com/m13253/kaigen-fonts>
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
# development
$ bundle exec rake db:create
# production
$ bundle exec rake db:create RAILS_ENV=production
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

## Change permission of home directory

```sh
$ chmod 711 ~
```


## Start

Running Skyhopper

```sh
# production
$ ./scripts/skyhopper_daemon.sh start
# usage start|stop|status
# staring mode for daemon
```

### [Note] Make sure to run this script first before starting Skyhopper in Development
```sh
# for generating i18n-js dictionary
$ bundle exec rake i18n:js:export
# for Precompiling assets
$ bundle exec rake assets:precompile
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
