Zabbix User Document
==========================


データ構造
----------------

```
SkyHopper#User           1 ----------- 1 Zabbix#user

SkyHopper#Project        1 ----------- 1 Zabbix#hostgroup
SkyHopper#Project        1 ----------- 2 Zabbix#usergroup

SkyHopper#Project        1 ----------- * SkyHopper#Infrastructure
SkyHopper#Infrastructure 1 ----------- * SkyHopper#Resource
SkyHopper#Resource       1 ----------- 1 Zabbix#Host

Zabbix#host              1 ----------- * Zabbix#hostgroup
Zabbix#hostgroup         * ----------- * Zabbix#usergroup
Zabbix#user              * ----------- * Zabbix#usergroup
```

また、Zabbix のユーザーはユーザー権限を持つ。

フロー
---------------

### Project を作成

- Projectに紐付いたZabbixの`hostgroup`が一つ作られる。
- Projectに紐付いたZabbixの`usergroup`が2つ作られる。
  - Read only
  - Read and Write

### User を作成

- SkyHopperのユーザーを作成する
- デフォルトのユーザーグループでZabbixのユーザーを作成する。
- master and admin ならば、Zabbixのuserの権限を`Zabbix特権管理者`にする。
- master のみであれば、Zabbixのuserのユーザーグループを`master`にする。

### User の更新

- master and admin ならば、デフォルトのユーザーグループでuserの権限を`Zabbix特権管理者`にする。
- masterのみであれば、Zabbixのuserのユーザーグループを`master`にする。
- assign されているProjectがなければ、デフォルトのユーザーグループに変更する。
- projectがassignされていて、adminのみであれば、各projectのユーザーグループの`-read-write` suffix が付与される。
- projectがassignされていて、admin でも master でもなければ、各ユーザーグループの`-read` suffix が付与される。

### Userの削除

- SkyHopper のユーザーが削除される。
- Zabbixのユーザーが削除される。

### Projectの削除

- Projectが削除される。
- Projectに紐付いたZabbixのhostgroupとusergroupが削除される。


References
----------------

### Zabbix documents

- User Group https://www.zabbix.com/documentation/2.2/jp/manual/config/users_and_usergroups/usergroup
- User permission https://www.zabbix.com/documentation/2.2/jp/manual/config/users_and_usergroups/permissions
