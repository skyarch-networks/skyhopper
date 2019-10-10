class MasterMonitoringAddKeyCol < ActiveRecord::Migration[4.2]
  def change
    add_column :master_monitorings, :key, :string
  end
end
