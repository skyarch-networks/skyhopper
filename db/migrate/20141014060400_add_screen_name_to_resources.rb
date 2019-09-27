class AddScreenNameToResources < ActiveRecord::Migration[4.2]
  def change
    add_column :resources, :screen_name, :string
  end
end
