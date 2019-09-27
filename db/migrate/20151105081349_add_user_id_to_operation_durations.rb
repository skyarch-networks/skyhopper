class AddUserIdToOperationDurations < ActiveRecord::Migration[4.2]
  def change
    add_column :operation_durations, :user_id, :integer
  end
end
