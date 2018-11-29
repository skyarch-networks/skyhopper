class AddDummyAndRemoveFqdnAndRemoveServerNameToAppSetting < ActiveRecord::Migration
  def change
    add_column :app_settings, :dummy, :boolean, after: :ec2_private_key_id
    sql = <<'EOS'
UPDATE app_settings
  SET dummy = CASE
    WHEN fqdn = "This is dummy!" THEN 1
    ELSE 0
    END;
EOS
    ActiveRecord::Base.connection.execute(sql)
    remove_column :app_settings, :fqdn
    remove_column :app_settings, :server_name
  end
end
