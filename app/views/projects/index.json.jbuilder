json.array!(@projects) do |project|
  json.id project.id
  json.code [project.code,project.infrastructures.count]
  json.name project.name
  json.cloud_provider project.cloud_provider.name
  json.access_key '***' + project.access_key[-3..-1].to_s

  json.infrastructures_path infrastructures_path(project_id: project.id)

  json.dishes_path dishes_path(project_id: project.id)
  json.key_pairs_path key_pairs_path(project_id: project.id)
  json.project_parameters_path project_parameters_path(project_id: project.id)
  json.project_settings  project_settings(project)

  if current_user.admin?
    json.delete_project_url delete_project_url(project)
    json.edit_project_url edit_project_path(project)
  end


  json.url project_url(project, format: :json)
end
