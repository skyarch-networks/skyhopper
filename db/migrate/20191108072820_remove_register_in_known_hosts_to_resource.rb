class RemoveRegisterInKnownHostsToResource < ActiveRecord::Migration[5.2]
  def change
    remove_column :resources, :register_in_known_hosts
  end
end
