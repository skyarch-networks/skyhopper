class AddPlaybookRolesAndExtraVersToDish < ActiveRecord::Migration[4.2]
  def change
    add_column :dishes, :playbook_roles, :text, after: :runlist
    add_column :dishes, :extra_vars, :text, after: :playbook_roles
  end
end
