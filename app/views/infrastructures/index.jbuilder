json.array!(@infrastructures) do |infrastructure|
  json.extract! infrastructure, :project_id, :stack_name, :region, :ec2_private_key_id
  json.url infrastructure_url(infrastructure, format: :json)
end
