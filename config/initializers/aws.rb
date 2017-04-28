AWS::Regions = Aws.partition('aws').service('EC2').regions.to_a.freeze

path = Rails.root.join(*%w[lib aws-instance-types.json])
AWS::InstanceTypes = JSON.parse(
  File.read(path),
  symbolize_names: true
).recursive_freeze
