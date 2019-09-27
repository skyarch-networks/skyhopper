class DropUnusedTemplatesTable < ActiveRecord::Migration[4.2]
  def up
    drop_table :templates
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
