class DropKindTable < ActiveRecord::Migration
  def change
    drop_table :mst_infra_kinds
    drop_table :mst_serv_icons
    remove_column :infrastructures, :kind
  end
end
