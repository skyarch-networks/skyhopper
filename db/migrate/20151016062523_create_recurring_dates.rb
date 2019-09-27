class CreateRecurringDates < ActiveRecord::Migration[4.2]
  def change
    create_table :recurring_dates do |t|
      t.string :operation_duration_id
      t.integer :repeats
      t.time :start_time
      t.time :end_time
      t.string :dates

      t.timestamps null: false
    end
  end
end
