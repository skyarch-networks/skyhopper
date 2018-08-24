namespace :update do
  desc 'Update the encrypted value of the database'
  task :update_encrypted_value => :environment do
    update_from_old_encrypted_attribute_value(User, :mfa_secret_key)
    update_from_old_encrypted_attribute_value(ZabbixServer, :password)
    update_from_old_encrypted_attribute_value(Project, :access_key)
    update_from_old_encrypted_attribute_value(Project, :secret_access_key)
    update_from_old_encrypted_attribute_value(Ec2PrivateKey, :value)
    puts 'Update completed.'
  end

  def update_from_old_encrypted_attribute_value(model, attribute)
    model.find_each do |record|
      begin
        record.__send__(attribute)
      rescue ActiveSupport::MessageVerifier::InvalidSignature
        old_encrypted_value = record.read_attribute(attribute)
        if old_encrypted_value.nil?
          next
        end
        record.__send__("#{attribute}=".to_sym, legacy_crypter.decrypt_and_verify(old_encrypted_value))
        record.save!
      end
    end
  end

  def legacy_crypter
    db_crypt_key = SkyHopper::Application.secrets[:db_crypt_key]
    key_len = ActiveSupport::MessageEncryptor.key_len
    secret = db_crypt_key.bytes[0..(key_len - 1)].pack('C*')
    ActiveSupport::MessageEncryptor.new(secret, db_crypt_key)
  end
end
