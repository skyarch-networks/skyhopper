class AddMfaSecretKeyToUser < ActiveRecord::Migration[4.2]
  def change
    add_column :users, :mfa_secret_key, :string, null: true
  end
end
