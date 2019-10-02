class AddPlaybookRolesAndExtraVersToResource < ActiveRecord::Migration[4.2]
  def change
    add_column :resources, :playbook_roles, :text, after: :dish_id
    add_column :resources, :extra_vars, :text, after: :playbook_roles
    # resources毎にansibleのstatusの値にun_executedを設定する
    connection = ActiveRecord::Base.connection
    select_sql = 'SELECT id FROM resources'
    resources = connection.select_all(select_sql)
    resources.each do |resource|
      insert_sql = <<"EOS"
INSERT INTO resource_statuses (
  resource_id,
  created_at,
  updated_at,
  value,
  kind
)
  VALUES (
    #{resource['id']},
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    3,
    3
  )
EOS
      ActiveRecord::Base.connection.execute(insert_sql)
    end
  end
end
