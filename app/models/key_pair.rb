#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

KeyPair = Struct.new(:name, :fingerprint, :region, :using) do
  class MissingKeyPairError < StandardError; end

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

    # @param [Integer] project_id
    # @param [String] region
    # @param [String] keypair_name
    # @param [String] keypair_value
    # @raise [MissingKeyPairError]
    def validate!(project_id, region, keypair_name, keypair_value)
      project = Project.find(project_id)

      ec2 = Aws::EC2::Client.new(
        access_key_id:     project.access_key,
        secret_access_key: project.secret_access_key,
        region:            region
      )

       keypairs_resp = ec2.describe_key_pairs.key_pairs

       keypair = keypairs_resp.find{|k| k.key_name == keypair_name}
       raise MissingKeyPairError, I18n.t('infrastructures.msg.invalid_keypair') unless keypair
       fingerprint = keypair.key_fingerprint.delete(':')

       if fingerprint.size == 32
         # Imported keypair
         pem = OpenSSL::PKey::RSA.new(keypair_value)
         pub = pem.public_key
         fingerprint_imported = OpenSSL::Digest::MD5.new(pub.to_der).to_s # => "c481261b1bafd395bd76ff4773433bcf"
         raise MissingKeyPairError, I18n.t('infrastructures.msg.invalid_keypair') if fingerprint != fingerprint_imported
       else # 40
         # Keypair from AWS console
         # XXX: OpenSSL::Digest::SHA1 doesn't work... so, use openssl command instead of it.
         data = IO.popen("openssl pkcs8 -nocrypt -topk8 -outform DER", 'r+') do |io|
           io.print(keypair_value)
           io.close_write
           io.read
         end
         fingerprint_created = OpenSSL::Digest::SHA1.new(data).to_s  # => "7d1816f1c0c961e490419f207c7fae43cd58f5d4"
         raise MissingKeyPairError, I18n.t('infrastructures.msg.invalid_keypair') if fingerprint != fingerprint_created
       end
    end
  end
end
