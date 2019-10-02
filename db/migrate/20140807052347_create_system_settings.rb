class CreateSystemSettings < ActiveRecord::Migration[4.2]
  def change
    create_table :system_settings do |t|
      t.string :chef_url
      t.string :chef_name
      t.string :chef_key
      t.string :sshkey_directory
      t.string :aws_keypair
      t.string :aws_region

      t.timestamps
    end
  end
end
