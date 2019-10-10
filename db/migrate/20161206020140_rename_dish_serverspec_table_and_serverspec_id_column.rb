class RenameDishServerspecTableAndServerspecIdColumn < ActiveRecord::Migration[4.2]
  def change
    rename_column :dish_serverspecs, :serverspec_id, :servertest_id
    rename_table :dish_serverspecs, :dish_servertests
  end
end
