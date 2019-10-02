class CreateEc2PrivateKeys < ActiveRecord::Migration[4.2]
  def change
    create_table :ec2_private_keys do |t|
      t.string :name
      t.text   :value
    end
  end
end
