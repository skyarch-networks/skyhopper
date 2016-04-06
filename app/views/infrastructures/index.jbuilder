json.array!(@infrastructures) do |infra|
  # json.extract! infrastructure, :id, :status, :project_id, :stack_name, :created_at, :region, :ec2_private_key_id, :keypairname
  json.id infra.id
  json.status infra.status
  json.project_id infra.project_id
  json.stack_name infra.stack_name

  json.created_at infra.created_at.strftime("%B %d, %Y at %l:%m %p %Z")


  json.region infra.region
  json.ec2_private_key_id infra.ec2_private_key_id
  json.keypairname infra.keypairname


  json.url infrastructure_url(infra, format: :json)
end
