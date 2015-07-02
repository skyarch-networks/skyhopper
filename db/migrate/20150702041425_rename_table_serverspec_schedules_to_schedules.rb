class RenameTableServerspecSchedulesToSchedules < ActiveRecord::Migration
  def change
    rename_table :serverspec_schedules, :schedules
  end
end
