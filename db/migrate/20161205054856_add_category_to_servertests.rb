class AddCategoryToServertests < ActiveRecord::Migration
  def change
    add_column :servertests, :category, :integer, null: false
  end
end
