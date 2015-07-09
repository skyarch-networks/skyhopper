class CryptizeEc2PrivateKeyValue < ActiveRecord::Migration
  def up
    Ec2PrivateKey.all.each do |key|
      v = key.read_attribute(:value)
      key.value = v
      key.save!
    end
  end
end
