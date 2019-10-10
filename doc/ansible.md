# Ansible機能について

## Ansible機能の説明
`<project-root>/ansible/roles`配下にお好きなAnsibleロールを配置してください。  
ロールは入れ子にすることができます。  

## Ansible機能の使い方
ここでは、`sky-touch`という名前のロールを作成して、EC2インスタンスに適用する例を説明します。  
`sky-touch`ロールの中身は、パラメータで渡されたパスにtouchをするという内容になります。  
なお、Ansible自体の使い方は解説しません。  

### Ansibleロールの準備
1. `<project-root>/ansible/roles`配下にロールのディレクトリを作ります。  
    例では、`sky-touch`を作成します。

1. 作成したロールのディレクトリの中に、ロールの中身を実装します。  
    例では、`tasks/main.yml`として、下記の内容のファイルを作成します。  
    ```yaml
    - name: touch
      file:
        path: "{{ touch_file_path }}"
        state: touch
    ```

1. これで準備は完了です。  
    例では、フォルダ構成は以下のようになっています。  
    ```
    $ tree ansible/roles/
    ansible/roles/
    └── sky-touch
        └── tasks
            └── main.yml
    ```

### playbookにAnsibleロールを選択
1. インフラストラクチャ一覧画面から、スタックを選択し、Ansibleを適用したいEC2インスタンスを表示します。  
    EC2インスタンスが起動していない場合は、起動させてください。

1. `playbookの編集`ボタンを押下します。
  
1. playbook編集画面が表示されます。  
    `playbook roles`に表示されているロールが適用されるロールとなります。  
    適用したいロールを`playbook roles`に設定してください。  
    `Ansible role`に表示されているロールを選択し`+`ボタンを押下することで、`playbook roles`に追加することができます。  
    例では`playbook roles`に`sky-touch`を設定します。

1. `extra-vars`に渡したいパラメータをJSONで指定します。  
    例では、下記を設定してください。(`touch_file_path`に`/hello-world.txt`を設定する内容となります。)
    ```json
    {"touch_file_path": "/hello-world.txt"}
    ```

1. `設定の保存`ボタンを押下します。  
    正常に設定が保存されたことを表すダイアログが表示されたことを確認して、`OK`ボタンを押下します。  

### playbookの適用
1. インフラストラクチャ一覧画面から、スタックを選択し、Ansibleを適用したいEC2インスタンスを表示します。  
1. Ansibleの`▲`ボタンを押下し、`run ansible-playbook`を押下します。  
1. playbookの適用が開始されたことを表すダイアログが表示されたことを確認して、`OK`ボタンを押下します。  
1. しばらくしたのち、playbookの適用が正常に終了したことを確認してください。
