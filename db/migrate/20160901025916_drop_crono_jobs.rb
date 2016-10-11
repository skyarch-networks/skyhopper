class DropCronoJobs < ActiveRecord::Migration
  def change
    drop_table :crono_jobs do |t|
      t.string    :job_id, null: false
      t.text      :log
      t.datetime  :last_performed_at
      t.boolean   :healthy
      t.timestamps null: false
    end
  end
end
