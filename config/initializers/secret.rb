SkyHopper::Application.secrets[:db_crypt_secret] = Proc.new {
  db_crypt_key = SkyHopper::Application.secrets[:db_crypt_key]
  db_crypt_salt = SkyHopper::Application.secrets[:db_crypt_salt]
  key_len = ActiveSupport::MessageEncryptor.key_len
  ActiveSupport::KeyGenerator.new(db_crypt_key).generate_key(db_crypt_salt, key_len)
}.call
