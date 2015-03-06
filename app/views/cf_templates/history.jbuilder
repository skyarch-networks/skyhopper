json.array! @histories do |h|
  json.id         h.id
  json.name       h.name
  json.created_at h.created_at
  json.detail     h.detail
end
