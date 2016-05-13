json.array!(@global_jsons) do |cf_template|
  json.subject cf_template.name
  json.details cf_template.detail
  json.id cf_template.id
  json.value cf_template.value


  json.button_edit_cft button_edit_cft(cf_template)
  json.button_destroy_cft button_destroy_cft(cf_template)

  json.url cf_template_url(cf_template, format: :json)
end
# json.cf_templates @global_jsons
