class CreateDishServerspecs < ActiveRecord::Migration
  def change
    create_table :dish_serverspecs do |t|
      t.integer "dish_id",       null: false
      t.integer "serverspec_id", null: false

      t.timestamps
    end
  end
end
