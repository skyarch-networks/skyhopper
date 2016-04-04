# json.clients   @clients
json.array!(@clients) do |client|
  json.id client.id
  json.code client.code
  json.name client.name
  json.projects client.projects.count

  if current_user.admin?
    json.can_edit can_edit(client)
    json.can_delete can_delete(client)
  end

  json.url client_url(client, format: :json)
end
