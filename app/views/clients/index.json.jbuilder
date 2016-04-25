# json.clients   @clients
json.array!(@clients) do |client|
  json.id client.id
  show_url = link_to client.code, projects_path(client_id: client.id)
  json.code [show_url , client.projects.count]
  json.name client.name
  json.projects_path projects_path(client_id: client.id)

  if current_user.admin?
    json.edit_client_path edit_client_path_url(client)
    json.delete_client_path delete_client_path(client)
  end

  json.url client_url(client, format: :json)
end
