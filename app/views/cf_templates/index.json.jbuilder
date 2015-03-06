json.array!(@cf_templates) do |cf_template|
  json.extract! cf_template, :infrastructure_id, :name, :detail, :value
  json.url cf_template_url(cf_template, format: :json)
end
