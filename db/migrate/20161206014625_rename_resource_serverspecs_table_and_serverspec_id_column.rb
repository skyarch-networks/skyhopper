class RenameResourceServerspecsTableAndServerspecIdColumn < ActiveRecord::Migration[4.2]
  def change
    rename_column :resource_serverspecs, :serverspec_id, :servertest_id
    rename_table :resource_serverspecs, :resource_servertests
  end
end
