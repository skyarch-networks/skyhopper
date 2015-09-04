# json.array!(@serverspec_logs) do |log|
#   json.extract! log, :physical_id
#   json.url log_url(log, format: :json)
# end
json.serverspec_logs @serverspec_logs
