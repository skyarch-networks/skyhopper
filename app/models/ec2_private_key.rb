#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Ec2PrivateKey < ActiveRecord::Base
  has_many :infrastructures
  has_many :app_settings
  validates :value, rsa: true

  extend Concerns::Cryptize
  cryptize :value

  class << self
    # AWSに新たに鍵ペアを作成し, それを返す。
    # @param [String] name KeyPair name.
    # @param [String|Integer] project_id Project ID
    # @param [String] region AWS region.
    # @return [Ec2PrivateKey] Created Ec2PrivateKey
    # @raise [Aws::EC2::Errors::InvalidKeyPairDuplicate]
    def new_from_aws(name, project_id, region)
      prj   = Project.find(project_id)
      infra = Infrastructure.new(project: prj, region: region)
      ec2   = infra.ec2
      key   = ec2.create_key_pair(key_name: name)
      return self.new(name: name, value: key.key_material)
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
