class AddIndexToResources < ActiveRecord::Migration[4.2]
  def change
    add_index :resources, :physical_id, unique: true
  end
end
