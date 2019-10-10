class AddVolumeIdToSchedules < ActiveRecord::Migration[4.2]
  def change
    add_column :schedules, :volume_id, :string, null: true
  end
end
