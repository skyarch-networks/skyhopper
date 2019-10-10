class DropKindTable < ActiveRecord::Migration[4.2]
  def change
    drop_table :mst_infra_kinds
    drop_table :mst_serv_icons
    remove_column :infrastructures, :kind
  end
end
