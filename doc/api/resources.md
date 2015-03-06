Resources
================


GET resources/index
----------------

### Request

- infrastructure_id

### Response

```json
{
  "ec2_instances": [
    {
      "physical_id": "i-hoge",
      "screen_name": "Web Instance"
    },
  ],
  "rds_instances": [
    {
      "physical_id": "fhsaklfh",
      "screen_name": "Web DB"
    },
  ],
  "s3_buckets": [
    {
      "physical_id": "fkjsafhlk",
      "screen_name": "Web Assets"
    },
  ]
}
```
