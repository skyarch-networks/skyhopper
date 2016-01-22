class CreateRetentionPolicies < ActiveRecord::Migration
  def change
    create_table :retention_policies do |t|
      t.string :resource_id, null: false
      t.integer :max_amount, null: true

      t.timestamps null: false
    end
  end
end
