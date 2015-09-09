json.array!(@serverspecs) do |serverspec|
  json.extract! serverspec, :id, :description, :name
  json.url serverspec_url(serverspec, format: :json)
end
