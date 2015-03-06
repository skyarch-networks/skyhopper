## コマンドラインからユーザーをまとめて追加


```sh
# 入力ファイル
$ cat users.txt
a@b.c,admin
b@c.d,master
c@d.e
hoge
fuga
ccc@b.ccc,no_project,admin
```

上記のように、作成したいユーザーごとにカンマ区切りでemailとオプションを指定します。
オプションは複数指定できます。
```
# options
master: master権限を付加します
admin: admin権限を付加します
no_project: ユーザー用の案件を生成しません
```
ユーザーは改行区切りで複数指定できます。

これらを記載したテキストファイルを第一引数、結果の出力先を第二引数に指定し、以下を実行するとユーザーが自動生成されます。
パスワードは自動生成されます。

```sh
$ bundle exec rake "register_users[users.txt, /tmp/result.txt]"
```

### 出力

```sh
$ cat /tmp/result.txt
[create ok] email:a@b.c password:15669d40
[create ok] email:b@c.d password:cc16eb71

[create ok] email:c@d.e password:14279a46
[create ng] email:hoge バリデーションに失敗しました。 Emailは不正な値です。
[create ng] email:fuga バリデーションに失敗しました。 Emailは不正な値です。
[create ok] email:ccc@b.ccc password:4ed0427d
```
