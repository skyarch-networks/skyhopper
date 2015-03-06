class RenameResourceTypeToResources < ActiveRecord::Migration
  def change
    rename_column :resources, :resource_type, :type_name
  end
end
