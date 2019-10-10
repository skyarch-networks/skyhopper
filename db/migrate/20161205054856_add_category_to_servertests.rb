class AddCategoryToServertests < ActiveRecord::Migration[4.2]
  def change
    add_column :servertests, :category, :integer
  end
end
