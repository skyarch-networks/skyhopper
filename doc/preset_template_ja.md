# テンプレートプリセットの用意
* `{skyhopper}/lib/cf_templates/preset_patterns` 下のjsonはモジュールをインクルートできます。
* モジュールは `{skyhopper}/lib/cf_templates/modules` 下に定義します。

* テンプレートからは `<%= skyhopper_modules["モジュール名"] %>` で参照できます。

## 例

### テンプレート
```json
...
"Mappings": {
    "RegionMap": <%= skyhopper_modules["ami_mappings_2014_09"] %>
},
...
```
### 参照されるモジュール
`ami_mappings_2014_09.json`
```json
{
    "us-east-1": {
        "AMI": "ami-b66ed3de"
    },
    "us-west-1": {
        "AMI": "ami-4b6f650e"
    },
    "us-west-2": {
        "AMI": "ami-b5a7ea85"
    },
    "eu-west-1": {
        "AMI": "ami-6e7bd919"
    },
    "sa-east-1": {
        "AMI": "ami-8737829a"
    },
    "ap-southeast-1": {
        "AMI": "ami-ac5c7afe"
    },
    "ap-southeast-2": {
        "AMI": "ami-63f79559"
    },
    "ap-northeast-1": {
        "AMI": "ami-4985b048"
    }
}
```

### 結果
```json
...
"Mappings": {
  "RegionMap": {
    "us-east-1": {
        "AMI": "ami-b66ed3de"
    },
    "us-west-1": {
        "AMI": "ami-4b6f650e"
    },
    "us-west-2": {
        "AMI": "ami-b5a7ea85"
    },
    "eu-west-1": {
        "AMI": "ami-6e7bd919"
    },
    "sa-east-1": {
        "AMI": "ami-8737829a"
    },
    "ap-southeast-1": {
        "AMI": "ami-ac5c7afe"
    },
    "ap-southeast-2": {
        "AMI": "ami-63f79559"
    },
    "ap-northeast-1": {
        "AMI": "ami-4985b048"
    }
  }
},
...
```
