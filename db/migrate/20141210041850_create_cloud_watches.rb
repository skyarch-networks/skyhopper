class CreateCloudWatches < ActiveRecord::Migration[4.2]
  def change
    create_table :cloud_watches do |t|

      t.timestamps
    end
  end
end
