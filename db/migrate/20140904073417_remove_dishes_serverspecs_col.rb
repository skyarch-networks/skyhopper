class RemoveDishesServerspecsCol < ActiveRecord::Migration[4.2]
  def up
    remove_column :dishes, :serverspecs
  end

  def down
    remove_column :dishes, :serverspecs, :text
  end
end
