class AddDetailsToSystemSetting < ActiveRecord::Migration[4.2]
  def change
    add_column :system_settings, :log_directory, :string
  end
end
