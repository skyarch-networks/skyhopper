#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'openssl'

class RsaValidator < ActiveModel::Validator
  def validate(record)
    v = record.value
    begin
      OpenSSL::PKey::RSA.new(v)
    rescue OpenSSL::PKey::RSAError
      record.errors[:value] << "is invalid as SSH key"
    end
  end
end
