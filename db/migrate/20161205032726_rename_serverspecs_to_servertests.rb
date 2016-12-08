class RenameServerspecsToServertests < ActiveRecord::Migration
  def change
    rename_table :serverspecs, :servertests
    add_reference :infrastructures, :infrastructure_id, index: true
  end
end
