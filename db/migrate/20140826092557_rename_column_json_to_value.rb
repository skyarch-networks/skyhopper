class RenameColumnJsonToValue < ActiveRecord::Migration
  def change
    rename_column :cf_templates, :json, :value
  end
end
