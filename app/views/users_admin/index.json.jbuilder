json.array!(@users) do |user|
  json.extract! user, :admin, :master, :email, :last_sign_in_at, :id
  json.url project_url(user, format: :json)
end
