class AddColumnToMasterMonitoring < ActiveRecord::Migration[4.2]
  def up
    add_column :master_monitorings, :is_common, :boolean
  end

  def down
    remove_column :master_monitorings, :is_common, :boolean
  end
end

