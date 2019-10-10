class AddDummyAndRemoveFqdnAndRemoveServerNameToAppSetting < ActiveRecord::Migration[4.2]
  def change
    add_column :app_settings, :dummy, :boolean, after: :ec2_private_key_id
    sql = <<'EOS'
UPDATE app_settings
  SET dummy = CASE
    WHEN aws_region = "This is dummy!" THEN 1
    WHEN log_directory = "This is dummy!" THEN 1
    WHEN fqdn = "This is dummy!" THEN 1
    WHEN server_name = "This is dummy!" THEN 1
    ELSE 0
    END;
EOS
    ActiveRecord::Base.connection.execute(sql)
    remove_column :app_settings, :fqdn
    remove_column :app_settings, :server_name
  end
end
