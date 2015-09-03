json.array!(@global_jsons) do |cf_template|
  json.extract! cf_template, :infrastructure_id, :name, :detail, :value, :id
  json.url cf_template_url(cf_template, format: :json)
end
# json.cf_templates @global_jsons
