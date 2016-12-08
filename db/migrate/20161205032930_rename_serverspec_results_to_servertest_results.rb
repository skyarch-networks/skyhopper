class RenameServerspecResultsToServertestResults < ActiveRecord::Migration
  def change
    rename_table :serverspec_results, :servertest_results
    add_reference :resources, :resource_id, index: true
  end
end
