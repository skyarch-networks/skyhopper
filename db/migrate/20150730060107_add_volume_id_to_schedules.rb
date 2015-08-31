class AddVolumeIdToSchedules < ActiveRecord::Migration
  def change
    add_column :schedules, :volume_id, :string, null: true
  end
end
