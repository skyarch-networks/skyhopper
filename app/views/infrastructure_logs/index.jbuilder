re = /^([^.]+\.)(.+)$/m

json.page do
  json.max     @max
  json.current @current
end

json.logs do
  json.array! @logs do |log|
    long = !!log.details[re]

    json.long       long
    json.status     log.status
    json.title      long ? log.details[re, 1] : log.details
    json.details    long ? log.details[re, 2] : nil
    json.created_at log.created_at
    json.id         log.id

    json.email log.user.try(:email) || I18n.t('users.unregistered')
    json.admin log.user.try(:admin) || false
  end
end
