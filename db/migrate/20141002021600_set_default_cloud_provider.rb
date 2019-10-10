class SetDefaultCloudProvider < ActiveRecord::Migration[4.2]
  def up
    Project.all.each do |prj|
      prj.cloud_provider_id = 1
      prj.save!
    end
    change_column :projects, :cloud_provider_id, :integer, null: false
  end

  def down
    change_column :projects, :cloud_provider_id, :integer, null: true
  end
end
