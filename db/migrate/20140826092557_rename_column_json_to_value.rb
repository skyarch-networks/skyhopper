class RenameColumnJsonToValue < ActiveRecord::Migration[4.2]
  def change
    rename_column :cf_templates, :json, :value
  end
end
