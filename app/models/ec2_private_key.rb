#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Ec2PrivateKey < ActiveRecord::Base
  has_many :infrastructures
  has_many :app_settings
  validates :value, rsa: true

  class << self
    # AWSに新たに鍵ペアを作成し, それを返す。
    # @param [String] name KeyPair name.
    # @param [String|Integer] project_id Project ID
    # @param [String] region AWS region.
    # @return [Ec2PrivateKey] Created Ec2PrivateKey
    # @raise [AWS::EC2::Errors::InvalidKeyPair::Duplicate]
    def new_from_aws(name, project_id, region)
      prj   = Project.find(project_id)
      infra = Infrastructure.new(project: prj, region: region)
      ec2   = infra.ec2
      key   = ec2.key_pairs.create(name)
      return self.new(name: name, value: key.private_key)
    end
  end

  ## テンポラリに鍵を書き出す
  def output_temp(prefix: "ec2key")
    @tmp = Tempfile.open(prefix)
    @tmp.print(self.value)
    @tmp.flush
  end

  def path_temp
    return nil unless @tmp
    @tmp.path
  end

  ## テンポラリの鍵を消す
  def close_temp
    return nil unless @tmp
    @tmp.close!
  end
end
