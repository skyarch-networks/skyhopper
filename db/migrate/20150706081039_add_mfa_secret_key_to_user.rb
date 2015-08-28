class AddMfaSecretKeyToUser < ActiveRecord::Migration
  def change
    add_column :users, :mfa_secret_key, :string, null: true
  end
end
