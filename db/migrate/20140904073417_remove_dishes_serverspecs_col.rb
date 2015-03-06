class RemoveDishesServerspecsCol < ActiveRecord::Migration
  def up
    remove_column :dishes, :serverspecs
  end

  def down
    remove_column :dishes, :serverspecs, :text
  end
end
