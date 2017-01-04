class AddCategoryToServertests < ActiveRecord::Migration
  def change
    add_column :servertests, :category, :integer
  end
end
