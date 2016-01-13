class CreateProjectParameterTable < ActiveRecord::Migration
  def change
    create_table :project_parameters do |t|
      t.references :project, index: true, foreign_key: true, null: false
      t.string :key, null: false
      t.string :value, null: false

      t.timestamps
    end
    add_index :project_parameters, [:project_id, :key], unique: true
  end
end
