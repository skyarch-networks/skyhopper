class RenameResourceServerspecsTableAndServerspecIdColumn < ActiveRecord::Migration
  def change
    rename_column :resource_serverspecs, :serverspec_id, :servertest_id
    rename_table :resource_serverspecs, :resource_servertests


    add_reference :resources, :resource_id, index: true
    add_index :servertests, :servertest_id
  end
end
