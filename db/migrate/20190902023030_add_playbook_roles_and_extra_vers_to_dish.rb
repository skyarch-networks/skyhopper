class AddPlaybookRolesAndExtraVersToDish < ActiveRecord::Migration
  def change
    add_column :dishes, :playbook_roles, :text, after: :runlist
    add_column :dishes, :extra_vars, :text, after: :playbook_roles
  end
end
