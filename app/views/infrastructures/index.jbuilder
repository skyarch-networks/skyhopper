json.array!(@infrastructures) do |infrastructure|
  json.extract! infrastructure, :id, :status, :project_id, :stack_name, :created_at, :region, :ec2_private_key_id, :keypairname
  json.url infrastructure_url(infrastructure, format: :json)
end
