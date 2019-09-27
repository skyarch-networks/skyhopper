class CreateServerspecResults < ActiveRecord::Migration[4.2]
  def change
    create_table :serverspec_results do |t|
      t.integer :resource_id
      t.integer :status

      t.timestamps null: false
    end
  end
end
