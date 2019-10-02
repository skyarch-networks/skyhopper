class RenameServerspecsToServertests < ActiveRecord::Migration[4.2]
  def change
    rename_table :serverspecs, :servertests
  end
end
