class AddPhysicalIdToServerspecSchedule < ActiveRecord::Migration
  def change
    add_column :serverspec_schedules, :physical_id, :string
  end
end
