class RenameServersoecResultDetailsTableAndServerspecIdColumn < ActiveRecord::Migration
  def change
    rename_column :serverspec_result_details, :serverspec_id, :servertest_id
    rename_column :serverspec_result_details, :serverspec_result_id, :servertest_result_id
    rename_table :serverspec_result_details, :servertest_result_details
  end
end
