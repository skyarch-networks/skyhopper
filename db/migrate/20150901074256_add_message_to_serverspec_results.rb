class AddMessageToServerspecResults < ActiveRecord::Migration[4.2]
  def change
    add_column :serverspec_results, :message, :text
  end
end
