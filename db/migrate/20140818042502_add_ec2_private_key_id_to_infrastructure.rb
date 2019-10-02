class AddEc2PrivateKeyIdToInfrastructure < ActiveRecord::Migration[4.2]
  def change
    add_column :infrastructures, :ec2_private_key_id, :integer
  end
end
