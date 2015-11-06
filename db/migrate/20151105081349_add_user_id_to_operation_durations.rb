class AddUserIdToOperationDurations < ActiveRecord::Migration
  def change
    add_column :operation_durations, :user_id, :integer
  end
end
