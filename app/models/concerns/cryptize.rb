#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module Concerns::Cryptize

  # @param [Symbol] name is an attributes name.
  def cryptize(name)
    # XXX: secrets を変更したときに正しく (en|de)crypt できる？
    crypter = method(:crypter)
    define_method(:"#{name}=") do |v|
      val = v.nil? ? v : crypter.call.encrypt_and_sign(v)
      self[name] = val
    end

    define_method(name) do
      v = self[name]
      v.nil? ? v : crypter.call.decrypt_and_verify(v)
    end
  end

  private
  def crypter
    secret = SkyHopper::Application.secrets[:db_crypt_key]
    ::ActiveSupport::MessageEncryptor.new(secret)
  end
end
