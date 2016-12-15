class RenameServerspecResultsToServertestResults < ActiveRecord::Migration
  def change
    rename_table :serverspec_results, :servertest_results
  end
end
