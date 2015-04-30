class AddPhysicalIdToServerspecSchedule < ActiveRecord::Migration
  def change
    add_column :serverspec_schedules, :physical_id, :string, null: false
  end
end
