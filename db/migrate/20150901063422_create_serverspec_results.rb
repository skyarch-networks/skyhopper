class CreateServerspecResults < ActiveRecord::Migration
  def change
    create_table :serverspec_results do |t|
      t.integer :resource_id
      t.integer :status

      t.timestamps null: false
    end
  end
end
