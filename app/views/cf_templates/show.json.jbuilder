# {
#   detail: String,
#   value:  String,
#   params: [ {parameter_key: String, parameter_value: String} ],
#   email:  String,
#   admin:  Boolean,
# }
json.detail @cf_template.detail
json.value  @cf_template.value
json.params JSON.parse(@cf_template.params)

json.email @operator[:email]
json.admin @operator[:is_admin]
