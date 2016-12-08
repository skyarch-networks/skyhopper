class RenameServersoecResultDetailsTableAndServerspecIdColumn < ActiveRecord::Migration
  def change
    rename_column :serverspec_result_details, :serverspec_id, :servertest_id
    rename_table :serverspec_result_details, :servertest_result_details

    add_reference :servertests, :servertest_id, index: true
    add_reference :servertest_results, :servertest_result_id, index: true
  end
end
