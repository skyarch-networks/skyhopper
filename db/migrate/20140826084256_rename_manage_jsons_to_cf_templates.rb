class RenameManageJsonsToCfTemplates < ActiveRecord::Migration[4.2]
  def change
    rename_table :manage_jsons, :cf_templates
  end
end
