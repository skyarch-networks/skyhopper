class CreateServerspecResultDetails < ActiveRecord::Migration[4.2]
  def change
    create_table :serverspec_result_details do |t|
      t.integer :serverspec_id
      t.integer :serverspec_result_id

      t.timestamps null: false
    end
  end
end
