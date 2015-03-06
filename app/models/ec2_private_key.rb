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
