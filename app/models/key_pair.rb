KeyPair = Struct.new(:name, :fingerprint, :region, :using) do
  class << self
    def all(project_id)
      project = Project.find(project_id)

      key_pairs = []
      threads = []
      AWS::Regions.each do |region|
        threads << Thread.new(key_pairs, region) {
          ec2 = Aws::EC2::Client.new(
            access_key_id:     project.access_key,
            secret_access_key: project.secret_access_key,
            region:            region
          )
          response = ec2.describe_instances
          using_keys = response.reservations.map { |e| e.instances[0].key_name }

          response = ec2.describe_key_pairs
          response.key_pairs.each do |key_pair|
            using = using_keys.include?(key_pair.key_name)
            key_pairs << KeyPair.new(key_pair.key_name, key_pair.key_fingerprint, region, using)
          end
        }
      end
      threads.each(&:join)

      key_pairs.sort_by(&:region)
    end
  end
end
