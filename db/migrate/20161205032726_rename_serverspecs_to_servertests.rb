class RenameServerspecsToServertests < ActiveRecord::Migration
  def change
    rename_table :serverspecs, :servertests
  end
end
