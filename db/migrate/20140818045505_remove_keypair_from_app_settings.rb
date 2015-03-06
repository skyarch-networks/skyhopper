class RemoveKeypairFromAppSettings < ActiveRecord::Migration
  def change
    remove_column :app_settings, :sshkey_directory, :string
    remove_column :app_settings, :aws_keypair, :string
  end
end
