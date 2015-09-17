json.array!(@serverspec_results) do |log|
  json.extract! log, :id, :result_id, :physical_id, :message, :status, :created_at, :name
end
#json.serverspec_results @serverspec_results
