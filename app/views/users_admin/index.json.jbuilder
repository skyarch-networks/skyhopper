json.array!(@users) do |user|
  json.role [(user.admin? ? admin_label : ''), (user.master? ? master_label : '')]
  json.email [gravatar(user.email), user.email, label_its_you(user)]
  json.last_sign_in_at user.last_sign_in_at.strftime('%B %d, %Y at %l:%m %p %Z') if user.last_sign_in_at?
  json.id user.id

  json.users_admin_path users_admin_path(user)

  json.url project_url(user, format: :json)
end
