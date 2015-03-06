class RemoveKeypairnameFromInfrastructures < ActiveRecord::Migration
  def change
    remove_column :infrastructures, :keypairname, :string
  end
end
