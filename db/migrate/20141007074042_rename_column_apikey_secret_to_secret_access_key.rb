class RenameColumnApikeySecretToSecretAccessKey < ActiveRecord::Migration
  def change
    rename_column :projects, :apikey_secret, :secret_access_key
  end
end
