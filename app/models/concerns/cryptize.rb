module Concerns::Cryptize

  # @param [Symbol] name is an attributes name.
  def cryptize(name)
    c = crypter
    define_method(:"#{name}=") do |v|
      val = v.nil? ? v : c.encrypt_and_sign(v)
      write_attribute(name, val)
    end

    define_method(name) do
      v = read_attribute(name)
      v.nil? ? v : c.decrypt_and_verify(v)
    end
  end

  private
  def crypter
    secret = SkyHopper::Application.secrets[:db_crypt_key]
    ::ActiveSupport::MessageEncryptor.new(secret)
  end
end
