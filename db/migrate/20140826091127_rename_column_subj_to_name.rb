class RenameColumnSubjToName < ActiveRecord::Migration
  def change
    rename_column :cf_templates, :subj, :name
  end
end
