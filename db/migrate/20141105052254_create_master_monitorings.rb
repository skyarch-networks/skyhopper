class CreateMasterMonitorings < ActiveRecord::Migration[4.2]
  def change
    create_table :master_monitorings do |t|
      t.string :name
    end

    add_index :master_monitorings, :name, unique: true
  end
end
