class RenameManageJsonsToCfTemplates < ActiveRecord::Migration
  def change
    rename_table :manage_jsons, :cf_templates
  end
end
