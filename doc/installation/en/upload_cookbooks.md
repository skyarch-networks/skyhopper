Upload Cookbooks
====================


Git clone
--------------

```sh
$ cd ~/
$ git clone https://github.com/skyarch-networks/skyhopper_cookbooks.git
```

Upload
----------

```sh
$ cd skyhopper/
$ bundle exec knife cookbook upload -ao ~/skyhopper_cookbooks/cookbooks/
$ bundle exec knife role from file ~/skyhopper_cookbooks/roles/*rb
```
