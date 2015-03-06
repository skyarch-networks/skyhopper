Infrastructures
==============

GET infrastructures/:id
---------------

### Response

```json
{
  "stack_status":  {
    "name": "CREATE_COMPLETE",
    "type": "OK"
  },
  "stack_name":    "NAME",
  "message":       "Stack:TestStack does not exist",
  "token_invalid": true
}
```

stack_status.type is OK, NG, NONE or IN_PROGRESS.

When stack does not exist, response has message field.

When AWS access token is invalid, "token_invalid" field is true.

GET infrastructures/:id/stack_events
---------------

### Response

```json
{
  "stack_status":  {
    "name": "CREATE_COMPLETE",
    "type": "OK"
  },
  "stack_events": [
    {
      "time":    "2015-xxxx",
      "type":    "AWS::Resource::Type",
      "logical": "Logical id",
      "status":  "CREATE_COMPLETE" ,
      "reason":  "Resource creation ..."
    }
  ]
}

```
