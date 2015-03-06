class CreateResources < ActiveRecord::Migration
  def change
    create_table :resources do |t|
      t.string :physical_id
      t.string :resource_type
      t.integer :infrastructure_id

      t.timestamps
    end
  end
end
