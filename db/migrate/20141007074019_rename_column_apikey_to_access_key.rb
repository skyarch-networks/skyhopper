class RenameColumnApikeyToAccessKey < ActiveRecord::Migration[4.2]
  def change
    rename_column :projects, :apikey, :access_key
  end
end
