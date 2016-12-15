class RenameResourceServerspecsTableAndServerspecIdColumn < ActiveRecord::Migration
  def change
    rename_column :resource_serverspecs, :serverspec_id, :servertest_id
    rename_table :resource_serverspecs, :resource_servertests
  end
end
