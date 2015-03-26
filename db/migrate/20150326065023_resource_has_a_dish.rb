class ResourceHasADish < ActiveRecord::Migration
  def change
    add_column :resources, :dish_id, :integer, null: true
  end
end
