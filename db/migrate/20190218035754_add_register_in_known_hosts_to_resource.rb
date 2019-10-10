class AddRegisterInKnownHostsToResource < ActiveRecord::Migration[4.2]
  def change
    add_column :resources, :register_in_known_hosts, :boolean, after: :screen_name
    update_sql = 'UPDATE resources SET register_in_known_hosts=1'
    ActiveRecord::Base.connection.execute(update_sql)
  end
end
