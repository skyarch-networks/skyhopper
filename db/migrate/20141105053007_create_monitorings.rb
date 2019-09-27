class CreateMonitorings < ActiveRecord::Migration[4.2]
  def change
    create_table :monitorings do |t|
      t.integer :infrastructure_id
      t.integer :master_monitoring_id
    end
  end
end
