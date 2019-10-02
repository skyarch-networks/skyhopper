class CreateOperationDurations < ActiveRecord::Migration[4.2]
  def change
    create_table :operation_durations do |t|
      t.integer :resource_id
      t.datetime :start_date
      t.datetime :end_date

      t.timestamps null: false
    end
  end
end
