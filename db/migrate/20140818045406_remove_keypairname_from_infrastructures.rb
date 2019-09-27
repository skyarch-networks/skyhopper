class RemoveKeypairnameFromInfrastructures < ActiveRecord::Migration[4.2]
  def change
    remove_column :infrastructures, :keypairname, :string
  end
end
