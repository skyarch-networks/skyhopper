class AddForeignKeyInfrastructuresToEc2PrivateKeyId < ActiveRecord::Migration
  def change
    add_foreign_key "infrastructures", "ec2_private_keys", on_delete: :cascade
  end
end
