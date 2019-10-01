class ChangeColumnToResourceStatus < ActiveRecord::Migration[5.2]
  def change
    rename_column :resource_statuses, :value, :content
  end
end
