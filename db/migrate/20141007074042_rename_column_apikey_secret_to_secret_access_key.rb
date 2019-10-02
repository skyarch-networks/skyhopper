class RenameColumnApikeySecretToSecretAccessKey < ActiveRecord::Migration[4.2]
  def change
    rename_column :projects, :apikey_secret, :secret_access_key
  end
end
