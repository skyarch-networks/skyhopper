class CreateServerspecSchedules < ActiveRecord::Migration
  def change
    create_table :serverspec_schedules do |t|
      t.boolean :enabled     , null: false, default: false
      t.integer :frequency   , null: true
      t.integer :day_of_week , null: true
      t.integer :time        , null: true

      t.timestamps null: false
    end
  end
end
