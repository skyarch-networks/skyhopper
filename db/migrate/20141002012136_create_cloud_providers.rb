class CreateCloudProviders < ActiveRecord::Migration[4.2]
  def change
    create_table :cloud_providers do |t|
      t.string :name
    end
  end
end
