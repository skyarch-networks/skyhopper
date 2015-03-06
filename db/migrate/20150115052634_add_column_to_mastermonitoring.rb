class AddColumnToMastermonitoring < ActiveRecord::Migration
  def up
    add_column :master_monitorings, :trigger_expression, :string
  end

  def down
    remove_column :master_monitorings, :trigger_expression, :string
  end
end
