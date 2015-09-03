class AddMessageToServerspecResults < ActiveRecord::Migration
  def change
    add_column :serverspec_results, :message, :text
  end
end
