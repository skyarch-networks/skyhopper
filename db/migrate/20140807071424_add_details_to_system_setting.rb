class AddDetailsToSystemSetting < ActiveRecord::Migration
  def change
    add_column :system_settings, :log_directory, :string
  end
end
