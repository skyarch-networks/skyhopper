class AddColumnToMasterMonitoring < ActiveRecord::Migration
  def up
    add_column :master_monitorings, :is_common, :boolean
  end

  def down
    remove_column :master_monitorings, :is_common, :boolean
  end
end

