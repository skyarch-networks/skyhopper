class AddPhysicalIdToServerspecSchedule < ActiveRecord::Migration[4.2]
  def change
    add_column :serverspec_schedules, :physical_id, :string
  end
end
