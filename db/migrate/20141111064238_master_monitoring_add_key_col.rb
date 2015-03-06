class MasterMonitoringAddKeyCol < ActiveRecord::Migration
  def change
    add_column :master_monitorings, :key, :string
  end
end
