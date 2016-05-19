json.array!(@serverspecs) do |serverspec|
  json.extract! serverspec, :id, :description
  json.serverspec_name serverspec.name 
  allow_change = @infrastructure_id ? current_user.admin? : current_user.master? && current_user.admin?

  if allow_change
    json.edit_serverspec_path edit_serverspec_path(serverspec)
    json.serverspec_path      serverspec_path(serverspec)
  end

  json.url serverspec_url(serverspec, format: :json)
end
