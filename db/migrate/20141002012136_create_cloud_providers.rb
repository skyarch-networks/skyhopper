class CreateCloudProviders < ActiveRecord::Migration
  def change
    create_table :cloud_providers do |t|
      t.string :name
    end
  end
end
