class DropUnusedTemplatesTable < ActiveRecord::Migration
  def up
    drop_table :templates
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
