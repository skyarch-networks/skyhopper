class RenameResourceTypeToResources < ActiveRecord::Migration[4.2]
  def change
    rename_column :resources, :resource_type, :type_name
  end
end
