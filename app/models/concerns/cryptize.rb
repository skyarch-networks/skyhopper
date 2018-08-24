#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
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
    ::ActiveSupport::MessageEncryptor.new(db_crypt_secret)
  end

  def db_crypt_secret
    db_crypt_secret = SkyHopper::Application.secrets[:db_crypt_secret]
    unless db_crypt_secret.nil?
      return db_crypt_secret
    end
    db_crypt_key = SkyHopper::Application.secrets[:db_crypt_key]
    db_crypt_salt = SkyHopper::Application.secrets[:db_crypt_salt]
    key_len = ActiveSupport::MessageEncryptor.key_len
    db_crypt_secret = ActiveSupport::KeyGenerator.new(db_crypt_key).generate_key(db_crypt_salt, key_len)
    SkyHopper::Application.secrets[:db_crypt_secret] = db_crypt_secret
    db_crypt_secret
  end
end
