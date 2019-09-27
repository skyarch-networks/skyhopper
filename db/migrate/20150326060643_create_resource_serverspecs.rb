class CreateResourceServerspecs < ActiveRecord::Migration[4.2]
  def change
    create_table :resource_serverspecs do |t|
      t.integer :resource_id, null: false
      t.integer :serverspec_id, null: false

      t.timestamps null: false
    end
  end
end
