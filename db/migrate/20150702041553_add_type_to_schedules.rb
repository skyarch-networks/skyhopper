class AddTypeToSchedules < ActiveRecord::Migration
  def up
    add_column :schedules, :type, :string

    Schedule.all.each do |e|
      e.type = 'ServerspecSchedule'
      e.save!
    end

    change_column :schedules, :type, :string, null: false
  end

  def down
    remove_column :schedules, :type
  end
end
