class AddScreenNameToResources < ActiveRecord::Migration
  def change
    add_column :resources, :screen_name, :string
  end
end
