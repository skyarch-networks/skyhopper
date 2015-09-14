#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

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
          keypairs_resp = ec2.describe_key_pairs.key_pairs
          next if keypairs_resp.empty?

          instances_resp = ec2.describe_instances
          using_keys = instances_resp.reservations.map { |e|
            instance = e.instances[0]
            next if instance.state.name == 'terminated'
            instance.key_name
          }

          keypairs_resp.each do |key_pair|
            using = using_keys.include?(key_pair.key_name)
            key_pairs << KeyPair.new(key_pair.key_name, key_pair.key_fingerprint, region, using)
          end
        }
      end
      threads.each(&:join)

      key_pairs.sort_by(&:region)
    end

    def find(params)
      key_pairs = []
      fingerprints = []
      project = Project.find(params[:project_id])

      ec2 = Aws::EC2::Client.new(
        access_key_id:     project.access_key,
        secret_access_key: project.secret_access_key,
        region:            params[:region]
      )

       keypairs_resp = ec2.describe_key_pairs.key_pairs

       keypairs_resp.each do |key_pair|
         if key_pair.key_name == params[:keypair_name]
           key_pairs.push(key_pair.key_fingerprint)
         end
       end

       #Imported keypair
       pem = OpenSSL::PKey::RSA.new(params[:keypair_value])
       pub = pem.public_key
       fingerprint_import = OpenSSL::Digest::MD5.new(pub.to_der).to_s  # => "c481261b1bafd395bd76ff4773433bcf"

       #Keypair from AWS console
       data = IO.popen("openssl pkcs8 -nocrypt -topk8 -outform DER", 'r+'){|io| io.print(params[:keypair_value]); io.close_write; io.read}
       fingerprint_aws = OpenSSL::Digest::SHA1.new(data).to_s.scan(/../).join(':')  # => "7d:18:16:f1:c0:c9:61:e4:90:41:9f:20:7c:7f:ae:43:cd:58:f5:d4"

       if key_pairs.include?(fingerprint_aws)
         return true
       elsif key_pairs.include?(fingerprint_import)
         return true
       else
         return false
       end

    end
  end
end
