json.array!(@servertests) do |servertest|
  json.extract! servertest, :id, :description, :category
  json.servertest_name servertest.name
  allow_change = @infrastructure_id ? current_user.admin? : current_user.master? && current_user.admin?

  if allow_change
    json.edit_servertest_path edit_servertest_path(servertest)
    json.servertest_path      servertest_path(servertest)
  end

  json.url servertest_url(servertest, format: :json)
end
