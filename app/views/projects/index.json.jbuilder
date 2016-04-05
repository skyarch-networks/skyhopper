json.array!(@projects) do |project|
  json.id project.id
  json.code project.code
  json.name project.name
  json.infrastructures project.infrastructures.count
  json.cloud_provider project.cloud_provider
  json.access_key project.access_key

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
