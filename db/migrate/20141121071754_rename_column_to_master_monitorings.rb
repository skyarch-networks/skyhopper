class RenameColumnToMasterMonitorings < ActiveRecord::Migration[4.2]
  def up
    rename_column :master_monitorings, :key, :item
  end

  def down
    rename_column :master_monitorings, :item, :key
  end
end
