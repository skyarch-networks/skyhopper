class CreateMonitorings < ActiveRecord::Migration
  def change
    create_table :monitorings do |t|
      t.integer :infrastructure_id
      t.integer :master_monitoring_id
    end
  end
end
