class RenameColumnApikeyToAccessKey < ActiveRecord::Migration
  def change
    rename_column :projects, :apikey, :access_key
  end
end
