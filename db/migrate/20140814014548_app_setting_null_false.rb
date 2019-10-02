class AppSettingNullFalse < ActiveRecord::Migration[4.2]
  def up
    _change_null(false)
  end

  def down
    _change_null(true)
  end

  def _change_null(bool)
    cols = [:chef_url, :chef_name, :chef_key, :sshkey_directory, :aws_keypair, :aws_region, :log_directory].freeze

    cols.each do |col|
      change_column :app_settings, col, :string, null: bool
    end
  end
end
