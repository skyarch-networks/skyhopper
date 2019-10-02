class RenameTableServerspecSchedulesToSchedules < ActiveRecord::Migration[4.2]
  def change
    rename_table :serverspec_schedules, :schedules
  end
end
