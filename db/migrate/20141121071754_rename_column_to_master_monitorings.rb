class RenameColumnToMasterMonitorings < ActiveRecord::Migration
  def up
    rename_column :master_monitorings, :key, :item
  end

  def down
    rename_column :master_monitorings, :item, :key
  end
end
