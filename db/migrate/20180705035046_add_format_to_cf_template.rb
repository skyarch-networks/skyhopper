class AddFormatToCfTemplate < ActiveRecord::Migration[4.2]
  def change
    add_column :cf_templates, :format, :integer, after: :value
    sql = 'UPDATE cf_templates SET format = 0;'
    ActiveRecord::Base.connection.execute(sql)
    change_column :cf_templates, :format, :integer, null: false
  end
end
