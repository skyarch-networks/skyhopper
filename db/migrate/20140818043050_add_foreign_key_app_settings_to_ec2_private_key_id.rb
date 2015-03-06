class AddForeignKeyAppSettingsToEc2PrivateKeyId < ActiveRecord::Migration
  def change
    add_foreign_key "app_settings", "ec2_private_keys", on_delete: :cascade
  end
end
