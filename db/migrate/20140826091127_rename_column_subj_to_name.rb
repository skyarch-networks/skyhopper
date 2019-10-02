class RenameColumnSubjToName < ActiveRecord::Migration[4.2]
  def change
    rename_column :cf_templates, :subj, :name
  end
end
