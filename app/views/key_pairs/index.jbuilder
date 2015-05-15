key_pairs = []

project = Project.find(@project_id)

AWS::Regions.each do |region|
  ec2 = Aws::EC2::Client.new(
    access_key_id:     project.access_key,
    secret_access_key: project.secret_access_key,
    region:            region
  )
  ec2.describe_key_pairs.key_pairs.each do |key_pair|
    key_pairs << KeyPair.new(key_pair.key_name, key_pair.key_fingerprint, region)
  end
end

json.key_pairs key_pairs
