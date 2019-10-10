class ChangeColumnNullResources < ActiveRecord::Migration[4.2]
  def change
    change_column_null :resources, :physical_id, false
    change_column_null :resources, :type_name, false
    change_column_null :resources, :infrastructure_id, false
  end
end
