class CreateCloudWatches < ActiveRecord::Migration
  def change
    create_table :cloud_watches do |t|

      t.timestamps
    end
  end
end
