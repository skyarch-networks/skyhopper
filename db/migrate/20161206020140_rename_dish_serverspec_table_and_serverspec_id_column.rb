class RenameDishServerspecTableAndServerspecIdColumn < ActiveRecord::Migration
  def change
    rename_column :dish_serverspecs, :serverspec_id, :servertest_id
    rename_table :dish_serverspecs, :dish_servertests
    add_reference :servertests, :servertest_id, index: true
    add_reference :dishes, :dish_id, index: true
  end
end
