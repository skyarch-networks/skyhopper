class ResourceHasADish < ActiveRecord::Migration[4.2]
  def change
    add_column :resources, :dish_id, :integer, null: true
  end
end
