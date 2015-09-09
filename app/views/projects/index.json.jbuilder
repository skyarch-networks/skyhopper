json.array!(@projects) do |project|
  json.extract! project, :id, :code, :name, :cloud_provider, :access_key
  json.url project_url(project, format: :json)
end
