class AddEc2PrivateKeyIdToAppSettings < ActiveRecord::Migration
  def change
    add_column :app_settings, :ec2_private_key_id, :integer
  end
end
