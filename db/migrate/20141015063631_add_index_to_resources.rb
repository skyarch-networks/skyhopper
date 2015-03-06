class AddIndexToResources < ActiveRecord::Migration
  def change
    add_index :resources, :physical_id, unique: true
  end
end
